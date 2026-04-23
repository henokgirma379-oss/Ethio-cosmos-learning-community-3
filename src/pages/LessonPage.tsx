import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { fetchBookmarks, addBookmark, removeBookmark } from '@/services/bookmarks';
import { markLessonComplete, fetchCompletedSubtopicIds } from '@/services/progress';
import { FallbackImage } from '@/components/MediaFallback';
import type { Subtopic, Topic, Bookmark as BookmarkType } from '@/types';

export function LessonPage() {
  const { topicSlug, lessonSlug } = useParams<{ topicSlug: string; lessonSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { topics, getSubtopics, loadSubtopics, getLesson, loadLesson } = useData();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [currentSubtopic, setCurrentSubtopic] = useState<Subtopic | null>(null);
  const [lesson, setLesson] = useState<{ blocks: { type: string; content: string }[] } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);

  useEffect(() => {
    if (!topicSlug || !lessonSlug) {
      navigate('/learning');
      return;
    }

    const foundTopic = topics.find((t) => t.slug === topicSlug);
    if (!foundTopic) {
      if (!topics.length) return;
      navigate('/learning');
      return;
    }

    setTopic(foundTopic);

    const loadData = async () => {
      setLoading(true);
      await loadSubtopics(foundTopic.id);
      const loadedSubtopics = getSubtopics(foundTopic.id);
      setSubtopics(loadedSubtopics);

      const foundSubtopic = loadedSubtopics.find((s) => s.slug === lessonSlug);
      if (!foundSubtopic) {
        navigate(`/learning/${topicSlug}`);
        return;
      }

      setCurrentSubtopic(foundSubtopic);

      // Load lesson content
      await loadLesson(foundSubtopic.id);
      const loadedLesson = getLesson(foundSubtopic.id);
      
      if (loadedLesson) {
        setLesson(loadedLesson);
      } else {
        // Fallback content
        setLesson({
          blocks: [
            { type: 'text', content: `Welcome to ${foundSubtopic.title}. This lesson will cover the fundamentals of this topic.` },
            { type: 'text', content: 'The content for this lesson is being prepared. Please check back later for the full lesson.' },
            { type: 'text', content: 'In the meantime, explore other topics in our learning section.' },
          ],
        });
      }

      // Check bookmark status
      if (user) {
        try {
          const userBookmarks = await fetchBookmarks(user.id);
          setBookmarks(userBookmarks);
          const bookmarked = userBookmarks.some((b) => b.itemId === foundSubtopic.id);
          setIsBookmarked(bookmarked);

          // Check completion status
          const completedIds = await fetchCompletedSubtopicIds(user.id);
          setIsCompleted(completedIds.includes(foundSubtopic.id));
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [topicSlug, lessonSlug, topics, navigate, loadSubtopics, getSubtopics, loadLesson, getLesson, user]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleBookmark = async () => {
    if (!user || !currentSubtopic || !topic) return;

    try {
      if (isBookmarked) {
        const bookmark = bookmarks.find((b) => b.itemId === currentSubtopic.id);
        if (bookmark) {
          await removeBookmark(user.id, bookmark.id);
          setBookmarks(bookmarks.filter((b) => b.id !== bookmark.id));
          setIsBookmarked(false);
          showToast('Bookmark removed');
        }
      } else {
        const newBookmark = await addBookmark(user.id, {
          itemType: 'subtopic',
          itemId: currentSubtopic.id,
          title: currentSubtopic.title,
          description: currentSubtopic.description,
          url: `/learning/${topic.slug}/${currentSubtopic.slug}`,
        });
        setBookmarks([...bookmarks, newBookmark]);
        setIsBookmarked(true);
        showToast('Bookmarked!');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleMarkComplete = async () => {
    if (!user || !currentSubtopic) return;

    try {
      await markLessonComplete(user.id, currentSubtopic.id);
      setIsCompleted(true);
      showToast('Lesson marked complete!');
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const getCurrentIndex = () => {
    return subtopics.findIndex((s) => s.id === currentSubtopic?.id);
  };

  const getPrevLesson = () => {
    const currentIndex = getCurrentIndex();
    return currentIndex > 0 ? subtopics[currentIndex - 1] : null;
  };

  const getNextLesson = () => {
    const currentIndex = getCurrentIndex();
    return currentIndex < subtopics.length - 1 ? subtopics[currentIndex + 1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!topic || !currentSubtopic) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Lesson not found</p>
          <Button onClick={() => navigate('/learning')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Button>
        </div>
      </div>
    );
  }

  const currentIndex = getCurrentIndex();
  const progress = subtopics.length > 0 ? ((currentIndex + 1) / subtopics.length) * 100 : 0;
  const prevLesson = getPrevLesson();
  const nextLesson = getNextLesson();

  return (
    <div className="min-h-screen bg-[#050810]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-orange-500 text-white px-6 py-3 rounded-full shadow-lg animate-in fade-in slide-in-from-top-4">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/learning" className="hover:text-white transition-colors">Learning</Link>
          <span>/</span>
          <Link to={`/learning/${topic.slug}`} className="hover:text-white transition-colors">{topic.title}</Link>
          <span>/</span>
          <span className="text-orange-500">{currentSubtopic.title}</span>
        </nav>

        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentSubtopic.emoji}</span>
              <h1 className="text-3xl font-bold text-white">{currentSubtopic.title}</h1>
            </div>
            {user && (
              <button
                onClick={handleBookmark}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-6 h-6 text-orange-500" />
                ) : (
                  <Bookmark className="w-6 h-6 text-gray-400 hover:text-orange-500" />
                )}
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
            <span>Lesson {currentIndex + 1} of {subtopics.length}</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-700" />
        </div>

        {/* Lesson Content */}
        <div className="space-y-8 mb-12">
          {lesson?.blocks.map((block, index) => (
            <div key={index}>
              {block.type === 'text' ? (
                <p className="text-gray-300 text-lg leading-relaxed">
                  {block.content}
                </p>
              ) : block.type === 'image' ? (
                <div className="rounded-xl overflow-hidden">
                  <FallbackImage
                    src={block.content}
                    alt="Lesson illustration"
                    className="w-full max-h-96 object-cover"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* Mark Complete */}
        {user && (
          <div className="mb-8">
            {isCompleted ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span>Lesson completed!</span>
              </div>
            ) : (
              <Button
                onClick={handleMarkComplete}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex items-center justify-between">
            {prevLesson ? (
              <Link
                to={`/learning/${topic.slug}/${prevLesson.slug}`}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">Previous</div>
                  <div className="text-sm">{prevLesson.title}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <Link
                to={`/learning/${topic.slug}/${nextLesson.slug}`}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <div className="text-right">
                  <div className="text-xs text-gray-500">Next</div>
                  <div className="text-sm">{nextLesson.title}</div>
                </div>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to={`/learning/${topic.slug}`}
                className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors"
              >
                <span>Complete Topic</span>
                <CheckCircle className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonPage;
