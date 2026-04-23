import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/DataContext';
import type { Subtopic, Topic } from '@/types';

export function TopicDetailPage() {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const navigate = useNavigate();
  const { topics, getSubtopics, loadSubtopics } = useData();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicSlug) {
      navigate('/learning');
      return;
    }

    const foundTopic = topics.find((t) => t.slug === topicSlug);
    if (!foundTopic) {
      if (!topics.length) return; // Still loading topics
      navigate('/learning');
      return;
    }

    setTopic(foundTopic);

    const loadData = async () => {
      setLoading(true);
      await loadSubtopics(foundTopic.id);
      const loadedSubtopics = getSubtopics(foundTopic.id);
      setSubtopics(loadedSubtopics);
      setLoading(false);
    };

    loadData();
  }, [topicSlug, topics, navigate, loadSubtopics, getSubtopics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading topic...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Topic not found</p>
          <Button onClick={() => navigate('/learning')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810]">
      {/* Hero Section */}
      <section 
        className="relative py-24"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 14, 26, 0.7), rgba(5, 8, 16, 0.95)), url(${topic.imageUrl || `/images/topic-${topic.slug}.jpg`})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/learning"
            className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{topic.emoji}</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {topic.title}
            </h1>
          </div>
          
          <p className="text-xl text-gray-300 max-w-2xl">
            {topic.description || `Explore the fascinating world of ${topic.title.toLowerCase()}.`}
          </p>
        </div>
      </section>

      {/* Lessons List */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8">
            Lessons in this Topic
          </h2>

          {subtopics.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-white/10">
              <p className="text-gray-400">No lessons available for this topic yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subtopics.map((subtopic, index) => (
                <Link
                  key={subtopic.id}
                  to={`/learning/${topic.slug}/${subtopic.slug}`}
                  className="group flex items-center gap-4 p-4 bg-slate-900 border border-white/10 rounded-xl hover:border-orange-500/50 transition-all"
                >
                  <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-orange-500/20 text-orange-500 rounded-lg font-mono font-bold">
                    {index + 1}
                  </span>
                  
                  <span className="text-2xl">{subtopic.emoji}</span>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors">
                      {subtopic.title}
                    </h3>
                    {subtopic.description && (
                      <p className="text-gray-400 text-sm truncate">
                        {subtopic.description}
                      </p>
                    )}
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default TopicDetailPage;
