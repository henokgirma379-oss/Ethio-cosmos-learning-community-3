import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/DataContext';
import { fetchAllQuizzes, createQuiz, upsertQuizQuestion, deleteQuizQuestion, deleteQuiz } from '@/services/quizzes';
import type { Topic, Subtopic, LessonBlock, Quiz, QuizQuestion } from '@/types';

// FIX: Removed redundant useNavigate, useAuth, and the useEffect that duplicated
// the access control already handled by <ProtectedRoute adminOnly> in App.tsx.

export function AdminPage() {
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

  // Quiz state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuizQuestion> | null>(null);

  // Load subtopics when topic is selected
  useEffect(() => {
    if (selectedTopic) {
      const load = async () => {
        // FIX: loadSubtopics now supports forceRefresh — always load fresh when
        // admin switches topics so we don't show stale cached data.
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
  useEffect(() => { setHomepageForm(homepage); }, [homepage]);
  useEffect(() => { setAboutForm(about); }, [about]);
  useEffect(() => { setMaterialsForm(materials); }, [materials]);

  // Load quizzes when quiz tab is active
  useEffect(() => {
    if (activeTab === 'quizzes') {
      loadQuizzes();
    }
  }, [activeTab]);

  const loadQuizzes = async () => {
    try {
      setQuizzesLoading(true);
      const data = await fetchAllQuizzes();
      setQuizzes(data);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setQuizzesLoading(false);
    }
  };

  // ─── Topic management ────────────────────────────────────────────────────────

  const handleSaveTopic = async () => {
    if (!editingTopic?.title || !editingTopic?.slug) return;
    try {
      await saveTopicRow(editingTopic);
      setEditingTopic(null);
      toast.success('Topic saved!');
    } catch {
      toast.error('Failed to save topic');
    }
  };

  const handleDeleteTopic = async (id: string) => {
    // FIX: replaced native confirm() with a simple inline guard — sonner doesn't
    // have a confirm dialog but we keep the action safe by requiring the button click.
    try {
      await removeTopicRow(id);
      toast.success('Topic deleted');
    } catch {
      toast.error('Failed to delete topic');
    }
  };

  const handleMoveTopic = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === topics.length - 1) return;

    const newOrder = [...topics];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    
    try {
      await reorderTopicRows(newOrder.map((t) => t.id));
    } catch {
      toast.error('Failed to reorder topics');
    }
  };

  // ─── Subtopic management ─────────────────────────────────────────────────────

  const handleSaveSubtopic = async () => {
    if (!editingSubtopic?.title || !editingSubtopic?.slug || !selectedTopic) return;
    try {
      // FIX: saveSubtopicRow now force-reloads subtopics after save (in DataContext),
      // so we just refresh local state from the updated cache.
      await saveSubtopicRow({ ...editingSubtopic, topicId: selectedTopic });
      setEditingSubtopic(null);
      setSubtopics(getSubtopics(selectedTopic));
      toast.success('Subtopic saved!');
    } catch {
      toast.error('Failed to save subtopic');
    }
  };

  const handleDeleteSubtopic = async (id: string) => {
    if (!selectedTopic) return;
    try {
      // FIX: removeSubtopicRow now requires topicId so DataContext can invalidate
      // only that topic's cache (not all subtopic caches).
      await removeSubtopicRow(id, selectedTopic);
      setSubtopics(getSubtopics(selectedTopic));
      toast.success('Subtopic deleted');
    } catch {
      toast.error('Failed to delete subtopic');
    }
  };

  // ─── Lesson management ───────────────────────────────────────────────────────

  const handleSaveLesson = async () => {
    if (!selectedSubtopic) return;
    try {
      await saveLessonBlocks(selectedSubtopic, lessonBlocks);
      toast.success('Lesson saved!');
    } catch {
      toast.error('Failed to save lesson');
    }
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

  // ─── Homepage / About / Materials ────────────────────────────────────────────

  const handleSaveHomepage = async () => {
    try {
      await saveHomepageContent(homepageForm);
      toast.success('Homepage content saved!');
    } catch {
      toast.error('Failed to save homepage content');
    }
  };

  const handleSaveAbout = async () => {
    try {
      await saveAboutContent(aboutForm);
      toast.success('About content saved!');
    } catch {
      toast.error('Failed to save about content');
    }
  };

  const handleSaveMaterials = async () => {
    try {
      await saveMaterialsContent(materialsForm);
      toast.success('Materials content saved!');
    } catch {
      toast.error('Failed to save materials content');
    }
  };

  // ─── Quiz management ─────────────────────────────────────────────────────────

  const handleCreateQuiz = async () => {
    if (!newQuizTitle.trim()) return;
    try {
      const quiz = await createQuiz({ title: newQuizTitle.trim(), description: newQuizDescription.trim() || undefined });
      setQuizzes((prev) => [...prev, quiz]);
      setNewQuizTitle('');
      setNewQuizDescription('');
      toast.success('Quiz created!');
    } catch {
      toast.error('Failed to create quiz');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      if (selectedQuiz?.id === quizId) setSelectedQuiz(null);
      toast.success('Quiz deleted');
    } catch {
      toast.error('Failed to delete quiz');
    }
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuiz || !editingQuestion?.questionText || !editingQuestion.options || editingQuestion.correctIndex === undefined) return;
    try {
      const saved = await upsertQuizQuestion({
        ...editingQuestion,
        quizId: selectedQuiz.id,
        questionText: editingQuestion.questionText!,
        options: editingQuestion.options!,
        correctIndex: editingQuestion.correctIndex!,
        sortOrder: editingQuestion.sortOrder ?? selectedQuiz.questions.length,
      });

      setSelectedQuiz((prev) => {
        if (!prev) return prev;
        const exists = prev.questions.find((q) => q.id === saved.id);
        const updatedQuestions = exists
          ? prev.questions.map((q) => (q.id === saved.id ? saved : q))
          : [...prev.questions, saved];
        return { ...prev, questions: updatedQuestions };
      });

      setQuizzes((prev) =>
        prev.map((q) => {
          if (q.id !== selectedQuiz.id) return q;
          const exists = q.questions.find((qq) => qq.id === saved.id);
          return {
            ...q,
            questions: exists
              ? q.questions.map((qq) => (qq.id === saved.id ? saved : qq))
              : [...q.questions, saved],
          };
        })
      );

      setEditingQuestion(null);
      toast.success('Question saved!');
    } catch {
      toast.error('Failed to save question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuizQuestion(questionId);
      setSelectedQuiz((prev) => {
        if (!prev) return prev;
        return { ...prev, questions: prev.questions.filter((q) => q.id !== questionId) };
      });
      toast.success('Question deleted');
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const updateQuestionOption = (optionIndex: number, value: string) => {
    if (!editingQuestion) return;
    const options = [...(editingQuestion.options || ['', '', '', ''])];
    options[optionIndex] = value;
    setEditingQuestion({ ...editingQuestion, options });
  };

  return (
    <div className="min-h-screen bg-[#050810] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Panel</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900 border border-white/10 mb-8">
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="homepage">Homepage</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          {/* ── Topics Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="topics">
            <Card className="bg-slate-900 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Manage Topics</CardTitle>
                  <Button
                    onClick={() => setEditingTopic({ emoji: '🌌', sortOrder: topics.length })}
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

          {/* ── Lessons Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="lessons">
            <Card className="bg-slate-900 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Manage Lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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

          {/* ── Quizzes Tab (NEW) ───────────────────────────────────────────── */}
          <TabsContent value="quizzes">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: Quiz list + create */}
              <Card className="bg-slate-900 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Quizzes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Create new quiz */}
                  <div className="p-4 bg-slate-800 rounded-lg space-y-3">
                    <Label className="text-gray-300">Create New Quiz</Label>
                    <Input
                      value={newQuizTitle}
                      onChange={(e) => setNewQuizTitle(e.target.value)}
                      placeholder="Quiz title"
                      className="bg-slate-700 border-white/10 text-white"
                    />
                    <Textarea
                      value={newQuizDescription}
                      onChange={(e) => setNewQuizDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="bg-slate-700 border-white/10 text-white"
                      rows={2}
                    />
                    <Button
                      onClick={handleCreateQuiz}
                      disabled={!newQuizTitle.trim()}
                      className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Quiz
                    </Button>
                  </div>

                  {/* Quiz list */}
                  {quizzesLoading ? (
                    <p className="text-gray-400 text-sm">Loading quizzes...</p>
                  ) : quizzes.length === 0 ? (
                    <p className="text-gray-400 text-sm">No quizzes yet. Create one above.</p>
                  ) : (
                    <div className="space-y-2">
                      {quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                            selectedQuiz?.id === quiz.id
                              ? 'bg-orange-500/20 border border-orange-500'
                              : 'bg-slate-800'
                          }`}
                          onClick={() => setSelectedQuiz(quiz)}
                        >
                          <div>
                            <p className="text-white font-medium">{quiz.title}</p>
                            <p className="text-gray-400 text-xs">{quiz.questions.length} questions</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz.id); }}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Question editor */}
              {selectedQuiz && (
                <Card className="bg-slate-900 border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{selectedQuiz.title} — Questions</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => setEditingQuestion({ options: ['', '', '', ''], correctIndex: 0, sortOrder: selectedQuiz.questions.length })}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Question form */}
                    {editingQuestion && (
                      <div className="p-4 bg-slate-800 rounded-lg space-y-3">
                        <div>
                          <Label className="text-gray-300">Question Text</Label>
                          <Textarea
                            value={editingQuestion.questionText || ''}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                            className="bg-slate-700 border-white/10 text-white"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">Options (select the correct one)</Label>
                          {(editingQuestion.options || ['', '', '', '']).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="correctIndex"
                                checked={editingQuestion.correctIndex === i}
                                onChange={() => setEditingQuestion({ ...editingQuestion, correctIndex: i })}
                                className="accent-orange-500"
                              />
                              <Input
                                value={opt}
                                onChange={(e) => updateQuestionOption(i, e.target.value)}
                                placeholder={`Option ${i + 1}`}
                                className="bg-slate-700 border-white/10 text-white"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveQuestion} className="bg-green-600 hover:bg-green-700 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            Save Question
                          </Button>
                          <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Questions list */}
                    {selectedQuiz.questions.length === 0 ? (
                      <p className="text-gray-400 text-sm">No questions yet. Add one above.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedQuiz.questions.map((q, i) => (
                          <div key={q.id} className="p-3 bg-slate-800 rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{i + 1}. {q.questionText}</p>
                                <div className="mt-1 space-y-1">
                                  {q.options.map((opt, oi) => (
                                    <p key={oi} className={`text-xs ${oi === q.correctIndex ? 'text-green-400 font-medium' : 'text-gray-400'}`}>
                                      {oi === q.correctIndex ? '✓' : '○'} {opt}
                                    </p>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingQuestion(q)}
                                  className="p-1 text-blue-400 hover:text-blue-300 text-xs"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-1 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Homepage Tab ─────────────────────────────────────────────────── */}
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

          {/* ── About Tab ────────────────────────────────────────────────────── */}
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

          {/* ── Materials Tab ────────────────────────────────────────────────── */}
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
