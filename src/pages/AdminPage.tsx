import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import type { Topic, Subtopic, LessonBlock } from '@/types';

export function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { 
    topics, 
    homepage, 
    about, 
    materials,
    saveTopicRow, 
    removeTopicRow, 
    reorderTopicRows,
    saveSubtopicRow,
    removeSubtopicRow,
    saveLessonBlocks,
    saveHomepageContent,
    saveAboutContent,
    saveMaterialsContent,
    loadSubtopics,
    getSubtopics,
    getLesson,
    loadLesson,
  } = useData();

  const [activeTab, setActiveTab] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [lessonBlocks, setLessonBlocks] = useState<LessonBlock[]>([]);

  // Form states
  const [editingTopic, setEditingTopic] = useState<Partial<Topic> | null>(null);
  const [editingSubtopic, setEditingSubtopic] = useState<Partial<Subtopic> | null>(null);
  const [homepageForm, setHomepageForm] = useState(homepage);
  const [aboutForm, setAboutForm] = useState(about);
  const [materialsForm, setMaterialsForm] = useState(materials);

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  // Load subtopics when topic is selected
  useEffect(() => {
    if (selectedTopic) {
      const load = async () => {
        await loadSubtopics(selectedTopic);
        setSubtopics(getSubtopics(selectedTopic));
      };
      load();
    }
  }, [selectedTopic, loadSubtopics, getSubtopics]);

  // Load lesson when subtopic is selected
  useEffect(() => {
    if (selectedSubtopic) {
      const load = async () => {
        await loadLesson(selectedSubtopic);
        const lesson = getLesson(selectedSubtopic);
        setLessonBlocks(lesson?.blocks || []);
      };
      load();
    }
  }, [selectedSubtopic, loadLesson, getLesson]);

  // Update forms when data changes
  useEffect(() => {
    setHomepageForm(homepage);
  }, [homepage]);

  useEffect(() => {
    setAboutForm(about);
  }, [about]);

  useEffect(() => {
    setMaterialsForm(materials);
  }, [materials]);

  // Topic management
  const handleSaveTopic = async () => {
    if (!editingTopic?.title || !editingTopic?.slug) return;
    await saveTopicRow(editingTopic);
    setEditingTopic(null);
  };

  const handleDeleteTopic = async (id: string) => {
    if (confirm('Are you sure? This will delete all subtopics and lessons.')) {
      await removeTopicRow(id);
    }
  };

  const handleMoveTopic = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === topics.length - 1) return;

    const newOrder = [...topics];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    
    await reorderTopicRows(newOrder.map((t) => t.id));
  };

  // Subtopic management
  const handleSaveSubtopic = async () => {
    if (!editingSubtopic?.title || !editingSubtopic?.slug || !selectedTopic) return;
    await saveSubtopicRow({ ...editingSubtopic, topicId: selectedTopic });
    setEditingSubtopic(null);
    await loadSubtopics(selectedTopic);
    setSubtopics(getSubtopics(selectedTopic));
  };

  const handleDeleteSubtopic = async (id: string) => {
    if (confirm('Are you sure?')) {
      await removeSubtopicRow(id);
      await loadSubtopics(selectedTopic);
      setSubtopics(getSubtopics(selectedTopic));
    }
  };

  // Lesson management
  const handleSaveLesson = async () => {
    if (!selectedSubtopic) return;
    await saveLessonBlocks(selectedSubtopic, lessonBlocks);
    alert('Lesson saved!');
  };

  const addLessonBlock = (type: 'text' | 'image') => {
    setLessonBlocks([...lessonBlocks, { type, content: '' }]);
  };

  const updateLessonBlock = (index: number, content: string) => {
    const newBlocks = [...lessonBlocks];
    newBlocks[index] = { ...newBlocks[index], content };
    setLessonBlocks(newBlocks);
  };

  const removeLessonBlock = (index: number) => {
    setLessonBlocks(lessonBlocks.filter((_, i) => i !== index));
  };

  // Homepage management
  const handleSaveHomepage = async () => {
    await saveHomepageContent(homepageForm);
    alert('Homepage content saved!');
  };

  // About management
  const handleSaveAbout = async () => {
    await saveAboutContent(aboutForm);
    alert('About content saved!');
  };

  // Materials management
  const handleSaveMaterials = async () => {
    await saveMaterialsContent(materialsForm);
    alert('Materials content saved!');
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050810] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Panel</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900 border border-white/10 mb-8">
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="homepage">Homepage</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          {/* Topics Tab */}
          <TabsContent value="topics">
            <Card className="bg-slate-900 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Manage Topics</CardTitle>
                  <Button
                    onClick={() => setEditingTopic({ emoji: '🌌', lessonCount: 0, sortOrder: topics.length })}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Topic
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingTopic && (
                  <div className="mb-6 p-4 bg-slate-800 rounded-lg space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Title</Label>
                        <Input
                          value={editingTopic.title || ''}
                          onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                          className="bg-slate-700 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Slug</Label>
                        <Input
                          value={editingTopic.slug || ''}
                          onChange={(e) => setEditingTopic({ ...editingTopic, slug: e.target.value })}
                          className="bg-slate-700 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Emoji</Label>
                        <Input
                          value={editingTopic.emoji || ''}
                          onChange={(e) => setEditingTopic({ ...editingTopic, emoji: e.target.value })}
                          className="bg-slate-700 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Image URL</Label>
                        <Input
                          value={editingTopic.imageUrl || ''}
                          onChange={(e) => setEditingTopic({ ...editingTopic, imageUrl: e.target.value })}
                          className="bg-slate-700 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Description</Label>
                      <Textarea
                        value={editingTopic.description || ''}
                        onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                        className="bg-slate-700 border-white/10 text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveTopic} className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingTopic(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {topics.map((topic, index) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{topic.emoji}</span>
                        <span className="text-white">{topic.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveTopic(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveTopic(index, 'down')}
                          disabled={index === topics.length - 1}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTopic(topic)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons">
            <Card className="bg-slate-900 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Manage Lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Topic Selector */}
                <div>
                  <Label className="text-gray-300">Select Topic</Label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger className="bg-slate-700 border-white/10 text-white">
                      <SelectValue placeholder="Choose a topic" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.emoji} {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTopic && (
                  <>
                    {/* Subtopics */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-gray-300">Subtopics</Label>
                        <Button
                          size="sm"
                          onClick={() => setEditingSubtopic({ emoji: '📚', sortOrder: subtopics.length })}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Subtopic
                        </Button>
                      </div>

                      {editingSubtopic && (
                        <div className="mb-4 p-4 bg-slate-800 rounded-lg space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-300">Title</Label>
                              <Input
                                value={editingSubtopic.title || ''}
                                onChange={(e) => setEditingSubtopic({ ...editingSubtopic, title: e.target.value })}
                                className="bg-slate-700 border-white/10 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-300">Slug</Label>
                              <Input
                                value={editingSubtopic.slug || ''}
                                onChange={(e) => setEditingSubtopic({ ...editingSubtopic, slug: e.target.value })}
                                className="bg-slate-700 border-white/10 text-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-300">Emoji</Label>
                              <Input
                                value={editingSubtopic.emoji || ''}
                                onChange={(e) => setEditingSubtopic({ ...editingSubtopic, emoji: e.target.value })}
                                className="bg-slate-700 border-white/10 text-white"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-gray-300">Description</Label>
                            <Textarea
                              value={editingSubtopic.description || ''}
                              onChange={(e) => setEditingSubtopic({ ...editingSubtopic, description: e.target.value })}
                              className="bg-slate-700 border-white/10 text-white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSaveSubtopic} className="bg-green-600 hover:bg-green-700 text-white">
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button variant="outline" onClick={() => setEditingSubtopic(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {subtopics.map((subtopic) => (
                          <div
                            key={subtopic.id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                              selectedSubtopic === subtopic.id
                                ? 'bg-orange-500/20 border border-orange-500'
                                : 'bg-slate-800'
                            }`}
                            onClick={() => setSelectedSubtopic(subtopic.id)}
                          >
                            <div className="flex items-center gap-3">
                              <span>{subtopic.emoji}</span>
                              <span className="text-white">{subtopic.title}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubtopic(subtopic.id);
                              }}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lesson Editor */}
                    {selectedSubtopic && (
                      <div className="border-t border-white/10 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-gray-300">Lesson Content</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addLessonBlock('text')}
                              className="border-white/20 text-white"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Text
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addLessonBlock('image')}
                              className="border-white/20 text-white"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Image
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {lessonBlocks.map((block, index) => (
                            <div key={index} className="p-4 bg-slate-800 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400 uppercase">{block.type}</span>
                                <button
                                  onClick={() => removeLessonBlock(index)}
                                  className="p-1 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              {block.type === 'text' ? (
                                <Textarea
                                  value={block.content}
                                  onChange={(e) => updateLessonBlock(index, e.target.value)}
                                  className="bg-slate-700 border-white/10 text-white"
                                  rows={4}
                                />
                              ) : (
                                <Input
                                  value={block.content}
                                  onChange={(e) => updateLessonBlock(index, e.target.value)}
                                  placeholder="Image URL"
                                  className="bg-slate-700 border-white/10 text-white"
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        {lessonBlocks.length > 0 && (
                          <Button onClick={handleSaveLesson} className="mt-4 bg-green-600 hover:bg-green-700 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            Save Lesson
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Homepage Tab */}
          <TabsContent value="homepage">
            <Card className="bg-slate-900 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Homepage Content</CardTitle>
                  <Button onClick={handleSaveHomepage} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-300">Hero Title</Label>
                  <Input
                    value={homepageForm.heroTitle}
                    onChange={(e) => setHomepageForm({ ...homepageForm, heroTitle: e.target.value })}
                    className="bg-slate-700 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Hero Subtitle</Label>
                  <Textarea
                    value={homepageForm.heroSubtitle}
                    onChange={(e) => setHomepageForm({ ...homepageForm, heroSubtitle: e.target.value })}
                    className="bg-slate-700 border-white/10 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <Card className="bg-slate-900 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">About Page Content</CardTitle>
                  <Button onClick={handleSaveAbout} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-300">Mission Text</Label>
                  <Textarea
                    value={aboutForm.missionText}
                    onChange={(e) => setAboutForm({ ...aboutForm, missionText: e.target.value })}
                    className="bg-slate-700 border-white/10 text-white"
                    rows={4}
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Who We Are - Paragraph 1</Label>
                  <Textarea
                    value={aboutForm.whoWeAreText1}
                    onChange={(e) => setAboutForm({ ...aboutForm, whoWeAreText1: e.target.value })}
                    className="bg-slate-700 border-white/10 text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Who We Are - Paragraph 2</Label>
                  <Textarea
                    value={aboutForm.whoWeAreText2}
                    onChange={(e) => setAboutForm({ ...aboutForm, whoWeAreText2: e.target.value })}
                    className="bg-slate-700 border-white/10 text-white"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card className="bg-slate-900 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Materials Content</CardTitle>
                  <Button onClick={handleSaveMaterials} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Manage gallery images, videos, and PDFs from the Supabase dashboard.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminPage;
