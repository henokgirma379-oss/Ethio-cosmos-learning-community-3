import { supabase } from '@/supabase';
import type { 
  DbQuiz, 
  DbQuizQuestion, 
  DbQuizAttempt, 
  Quiz, 
  QuizQuestion, 
  QuizAttempt 
} from '@/types';

export function mapQuizQuestion(dbQuestion: DbQuizQuestion): QuizQuestion {
  return {
    id: dbQuestion.id,
    quizId: dbQuestion.quiz_id,
    questionText: dbQuestion.question_text,
    options: dbQuestion.options,
    correctIndex: dbQuestion.correct_index,
    sortOrder: dbQuestion.sort_order,
  };
}

export function mapQuiz(dbQuiz: DbQuiz, questions: QuizQuestion[]): Quiz {
  return {
    id: dbQuiz.id,
    topicId: dbQuiz.topic_id,
    subtopicId: dbQuiz.subtopic_id,
    title: dbQuiz.title,
    description: dbQuiz.description,
    questions: questions.sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function mapQuizAttempt(dbAttempt: DbQuizAttempt): QuizAttempt {
  return {
    id: dbAttempt.id,
    userId: dbAttempt.user_id,
    quizId: dbAttempt.quiz_id,
    score: dbAttempt.score,
    total: dbAttempt.total,
    answers: dbAttempt.answers,
    completedAt: dbAttempt.completed_at,
  };
}

export async function fetchAllQuizzes(): Promise<Quiz[]> {
  const { data: quizzesData, error: quizzesError } = await supabase
    .from('quizzes')
    .select('*');

  if (quizzesError) {
    console.error('Error fetching quizzes:', quizzesError);
    throw quizzesError;
  }

  const quizzes = quizzesData as DbQuiz[] || [];
  
  if (quizzes.length === 0) {
    return [];
  }

  const quizIds = quizzes.map((q) => q.id);
  
  const { data: questionsData, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*')
    .in('quiz_id', quizIds);

  if (questionsError) {
    console.error('Error fetching quiz questions:', questionsError);
    throw questionsError;
  }

  const questionsByQuiz = new Map<string, QuizQuestion[]>();
  (questionsData as DbQuizQuestion[] || []).forEach((q) => {
    const existing = questionsByQuiz.get(q.quiz_id) || [];
    existing.push(mapQuizQuestion(q));
    questionsByQuiz.set(q.quiz_id, existing);
  });

  return quizzes.map((q) => mapQuiz(q, questionsByQuiz.get(q.id) || []));
}

export async function fetchQuiz(quizId: string): Promise<Quiz | null> {
  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single();

  if (quizError) {
    console.error('Error fetching quiz:', quizError);
    throw quizError;
  }

  if (!quizData) return null;

  const { data: questionsData, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order', { ascending: true });

  if (questionsError) {
    console.error('Error fetching quiz questions:', questionsError);
    throw questionsError;
  }

  const questions = (questionsData as DbQuizQuestion[] || []).map(mapQuizQuestion);
  return mapQuiz(quizData as DbQuiz, questions);
}

export async function saveQuizAttempt(
  userId: string,
  quizId: string,
  score: number,
  total: number,
  answers: number[]
): Promise<QuizAttempt> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      quiz_id: quizId,
      score,
      total,
      answers,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving quiz attempt:', error);
    throw error;
  }

  return mapQuizAttempt(data as DbQuizAttempt);
}

export async function fetchQuizAttempts(userId: string): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching quiz attempts:', error);
    throw error;
  }

  return (data as DbQuizAttempt[] || []).map(mapQuizAttempt);
}

// Admin functions
export async function createQuiz(
  quiz: Partial<Quiz> & { title: string }
): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      title: quiz.title,
      description: quiz.description,
      topic_id: quiz.topicId,
      subtopic_id: quiz.subtopicId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }

  return mapQuiz(data as DbQuiz, []);
}

export async function upsertQuizQuestion(
  question: Partial<QuizQuestion> & { quizId: string; questionText: string; options: string[]; correctIndex: number }
): Promise<QuizQuestion> {
  const dbQuestion: Partial<DbQuizQuestion> = {
    quiz_id: question.quizId,
    question_text: question.questionText,
    options: question.options,
    correct_index: question.correctIndex,
  };

  if (question.id) dbQuestion.id = question.id;
  if (question.sortOrder !== undefined) dbQuestion.sort_order = question.sortOrder;

  const { data, error } = await supabase
    .from('quiz_questions')
    .upsert(dbQuestion)
    .select()
    .single();

  if (error) {
    console.error('Error upserting quiz question:', error);
    throw error;
  }

  return mapQuizQuestion(data as DbQuizQuestion);
}

export async function deleteQuizQuestion(questionId: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    console.error('Error deleting quiz question:', error);
    throw error;
  }
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId);

  if (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
}
