
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { FallbackImage } from '@/components/MediaFallback';

export function HomePage() {
  const { user } = useAuth();
  const { homepage, topics } = useData();

  const scrollToFeatures = () => {
    document.getElementById('feature-cards')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050810]">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 14, 26, 0.7), rgba(5, 8, 16, 0.9)), url(/images/hero-bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {homepage.heroTitle}
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              {homepage.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              {!user && (
                <Link to="/login">
                  <Button 
                    size="lg" 
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8"
                  >
                    Begin Your Journey
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              )}
              <Button 
                size="lg" 
                variant="outline" 
                onClick={scrollToFeatures}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowRight className="w-6 h-6 text-white/50 rotate-90" />
        </div>
      </section>

      {/* Feature Cards */}
      <section id="feature-cards" className="relative -mt-32 z-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {homepage.featureCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-xl p-8"
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-600">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Topics */}
      <section className="py-20 bg-[#050810]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Featured Topics
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Start your journey with these carefully selected astronomy topics
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {homepage.featuredTopics.map((topic) => (
              <Link
                key={topic.id}
                to={`/learning`}
                className="group relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 hover:border-orange-500/50 transition-all duration-300"
              >
                <div className="h-48 overflow-hidden">
                  <FallbackImage
                    src={topic.image}
                    alt={topic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {topic.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/learning">
              <Button 
                size="lg" 
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Explore All Topics
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                {topics.length}
              </div>
              <div className="text-gray-400">Topics</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                50+
              </div>
              <div className="text-gray-400">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                1K+
              </div>
              <div className="text-gray-400">Learners</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                24/7
              </div>
              <div className="text-gray-400">Community</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
