import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { fetchCompletedSubtopicIds, buildTopicProgress, calculateOverallProgress, getAchievements, getUnlockedAchievements } from '@/services/progress';
import { fetchSubtopics } from '@/services/topics';
import type { TopicProgress, Subtopic } from '@/types';

export function ProgressPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { topics } = useData();
  
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [allSubtopics, setAllSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch completed subtopic IDs
        const ids = await fetchCompletedSubtopicIds(user.id);
        setCompletedIds(ids);

        // Fetch all subtopics for all topics
        const subtopicsPromises = topics.map((topic) => fetchSubtopics(topic.id));
        const subtopicsArrays = await Promise.all(subtopicsPromises);
        const allSubs = subtopicsArrays.flat();
        setAllSubtopics(allSubs);

        // Build topic progress
        const progress = buildTopicProgress(topics, allSubs, ids);
        setTopicProgress(progress);
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user, topics]);

  const totalCompleted = completedIds.length;
  const totalLessons = allSubtopics.length;
  const overallProgress = calculateOverallProgress(totalCompleted, totalLessons);
  const achievements = getAchievements();
  const unlockedAchievements = getUnlockedAchievements(totalCompleted);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Your Progress</h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-900 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Lessons Completed
              </CardTitle>
              <BookOpen className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {totalCompleted}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                out of {totalLessons} total lessons
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Overall Progress
              </CardTitle>
              <Target className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {overallProgress}%
              </div>
              <Progress 
                value={overallProgress} 
                className="h-2 mt-2 bg-slate-700"
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Achievements
              </CardTitle>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {unlockedAchievements.length}/{achievements.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                achievements unlocked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Topic Progress */}
        <Card className="bg-slate-900 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Progress by Topic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topicProgress.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No topics available yet.
              </p>
            ) : (
              topicProgress.map((topic) => {
                const percentage = topic.totalLessons > 0
                  ? Math.round((topic.completedLessons / topic.totalLessons) * 100)
                  : 0;

                return (
                  <div key={topic.topicId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">{topic.topicName}</span>
                      <span className="text-gray-400">
                        {topic.completedLessons}/{topic.totalLessons}
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2 bg-slate-700"
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const isUnlocked = unlockedAchievements.some(
                (a) => a.id === achievement.id
              );

              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isUnlocked
                      ? 'bg-slate-900 border-orange-500'
                      : 'bg-slate-900/50 border-slate-800 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h3 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                    {achievement.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {achievement.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressPage;
