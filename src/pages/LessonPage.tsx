import { useParams, Link } from 'react-router-dom';
import { useCms } from '@/context/CmsContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { ArrowLeft, ArrowRight, BookmarkPlus, BookmarkCheck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SafeImage } from '@/components/SafeImage';
import { useState, useEffect } from 'react';
import { isBookmarked as checkIsBookmarked } from '@/services/cms';
import { isLessonCompleted as checkIsLessonCompleted, markLessonCompleted } from '@/services/cms';

export default function LessonPage() {
  const { topicId, lessonId } = useParams<{ topicId: string; lessonId: string }>();
  const { topics: topicsHook, subtopics: subtopicsHook, lesson: lessonHook } = useCms();
  const { user } = useAuth();
  
  const { topics, loading: topicsLoading, error: topicsError } = topicsHook;
  const { subtopics, loading: subtopicsLoading, error: subtopicsError } = subtopicsHook(topicId ?? null);
  const { lesson, loading: lessonLoading, error: lessonError } = lessonHook(lessonId ?? null);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topic = topics.find(t => t.id === topicId);
  const currentSubtopic = subtopics.find(s => s.id === lessonId);
  const currentIndex = subtopics.findIndex(s => s.id === lessonId);
  
  const prevLesson = currentIndex > 0 ? subtopics[currentIndex - 1] : null;
  const nextLesson = currentIndex < subtopics.length - 1 ? subtopics[currentIndex + 1] : null;
  const progress = subtopics.length > 0 ? ((currentIndex + 1) / subtopics.length) * 100 : 0;

  // Check bookmark and progress status on mount
  useEffect(() => {
    if (!user || !currentSubtopic || !topicId || !lessonId) return;

    const checkStatus = async () => {
      try {
        const bookmarked = await checkIsBookmarked(user.id, `/learning/${topicId}/${lessonId}`);
        setIsBookmarked(bookmarked);

        const completed = await checkIsLessonCompleted(user.id, lessonId);
        setIsCompleted(completed);
      } catch (err) {
        console.error('Unexpected error checking status:', err);
      }
    };
    checkStatus();
  }, [user, currentSubtopic, topicId, lessonId]);

  const handleBookmark = async () => {
    if (!user) {
      setError('Please log in to bookmark lessons.');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      if (isBookmarked) {
        const { error: deleteError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('url', `/learning/${topicId}/${lessonId}`);

        if (deleteError) throw deleteError;
        setIsBookmarked(false);
      } else {
        const { error: insertError } = await supabase.from('bookmarks').insert({
          user_id: user.id,
          title: currentSubtopic?.title || 'Untitled Lesson',
          url: `/learning/${topicId}/${lessonId}`,
          type: 'lesson',
        });

        if (insertError) throw insertError;
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Error updating bookmark:', err);
      setError('Failed to update bookmark. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!user || isCompleted || !lessonId) return;

    setActionLoading(true);
    setError(null);

    try {
      await markLessonCompleted(user.id, lessonId);
      setIsCompleted(true);
    } catch (err) {
      console.error('Error marking lesson complete:', err);
      setError('Failed to mark lesson complete. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (topicsLoading || subtopicsLoading || lessonLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#0a0e1a] text-white">
        Loading lesson...
      </div>
    );
  }

  if (topicsError || subtopicsError || lessonError) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#0a0e1a] text-red-400">
        Error loading lesson: {topicsError || subtopicsError || lessonError}
      </div>
    );
  }

  if (!topic || !currentSubtopic) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Lesson Not Found</h1>
          <Link to={`/learning/${topicId}`}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <ArrowLeft size={18} className="mr-2" />
              Back to Topic
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Default lesson content if none exists in DB
  const defaultBlocks = [
    { type: 'text' as const, content: `${currentSubtopic.title} is an important topic in astronomy. In this lesson, we will explore the key concepts and understand why it matters in our study of the cosmos.` },
    { type: 'text' as const, content: currentSubtopic.description },
    { type: 'text' as const, content: 'As you continue your journey through astronomy, remember that each discovery builds upon previous knowledge. Take time to observe the night sky and apply what you learn.' }
  ];

  const blocks = lesson?.content_blocks || defaultBlocks;

  return (
    <div className="min-h-screen pt-16 bg-[#0a0e1a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/learning" className="hover:text-white">Learning</Link>
          <span>/</span>
          <Link to={`/learning/${topicId}`} className="hover:text-white">{topic.title}</Link>
          <span>/</span>
          <span className="text-orange-500">{currentSubtopic.title}</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{currentSubtopic.emoji}</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{currentSubtopic.title}</h1>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-gray-400">
              Lesson {currentIndex + 1} of {subtopics.length}
            </span>
            <div className="flex-1 max-w-xs">
              <Progress value={progress} className="h-2 bg-slate-700" />
            </div>
          </div>

          {/* Action Buttons */}
          {user && (
            <div className="flex gap-2">
              <Button
                onClick={handleBookmark}
                disabled={actionLoading}
                variant="outline"
                className={`border-white/20 text-white hover:bg-white/10 ${
                  isBookmarked ? 'bg-orange-500/20 border-orange-500/50' : ''
                }`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck size={18} className="mr-2" />
                    Bookmarked
                  </>
                ) : (
                  <>
                    <BookmarkPlus size={18} className="mr-2" />
                    Bookmark
                  </>
                )}
              </Button>
              {!isCompleted && (
                <Button
                  onClick={handleMarkCompleted}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Mark Complete
                </Button>
              )}
              {isCompleted && (
                <Button
                  disabled
                  className="bg-green-600/50 text-white"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Completed
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Lesson Content */}
        <div className="space-y-8 mb-12">
          {blocks.map((block, index) => (
            <div key={index}>
              {block.type === 'text' ? (
                <p className="text-gray-300 leading-relaxed text-lg">{block.content}</p>
              ) : (
                <div className="my-8">
                  <SafeImage
                    src={block.content}
                    alt="Lesson illustration"
                    className="w-full rounded-lg"
                    fallbackText="Lesson image not available"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-white/10">
          {prevLesson ? (
            <Link to={`/learning/${topicId}/${prevLesson.id}`}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <ArrowLeft size={18} className="mr-2" />
                Previous Lesson
              </Button>
            </Link>
          ) : (
            <div />
          )}
          
          {nextLesson ? (
            <Link to={`/learning/${topicId}/${nextLesson.id}`}>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Next Lesson
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          ) : (
            <Link to={`/learning/${topicId}`}>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Complete Topic
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
