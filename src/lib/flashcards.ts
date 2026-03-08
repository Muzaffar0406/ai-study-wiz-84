import { supabase } from "@/integrations/supabase/client";

export interface Flashcard {
  id: string;
  user_id: string;
  front: string;
  back: string;
  note_id: string | null;
  next_review: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  created_at: string;
  updated_at: string;
}

// SM-2 Algorithm
// Quality ratings: 0-5
// 0 = complete blackout, 5 = perfect response
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

interface SM2Result {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  next_review: Date;
}

export function sm2Algorithm(
  quality: ReviewQuality,
  repetitions: number,
  easeFactor: number,
  intervalDays: number
): SM2Result {
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  let newReps: number;

  if (quality < 3) {
    // Failed — reset
    newReps = 0;
    newInterval = 0;
  } else {
    newReps = repetitions + 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(intervalDays * newEF);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    interval_days: newInterval,
    ease_factor: Math.round(newEF * 100) / 100,
    repetitions: newReps,
    next_review: nextReview,
  };
}

export async function fetchFlashcards(userId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Flashcard[];
}

export async function fetchDueFlashcards(userId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .lte("next_review", new Date().toISOString())
    .order("next_review", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Flashcard[];
}

export async function createFlashcard(card: {
  user_id: string;
  front: string;
  back: string;
  note_id?: string | null;
}): Promise<Flashcard> {
  const { data, error } = await supabase
    .from("flashcards")
    .insert(card)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Flashcard;
}

export async function createFlashcardsBatch(cards: {
  user_id: string;
  front: string;
  back: string;
  note_id?: string | null;
}[]): Promise<void> {
  const { error } = await supabase
    .from("flashcards")
    .insert(cards);
  if (error) throw error;
}

export async function updateFlashcardReview(
  id: string,
  quality: ReviewQuality,
  currentCard: Flashcard
): Promise<void> {
  const result = sm2Algorithm(
    quality,
    currentCard.repetitions,
    currentCard.ease_factor,
    currentCard.interval_days
  );

  const { error } = await supabase
    .from("flashcards")
    .update({
      interval_days: result.interval_days,
      ease_factor: result.ease_factor,
      repetitions: result.repetitions,
      next_review: result.next_review.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteFlashcard(id: string): Promise<void> {
  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
