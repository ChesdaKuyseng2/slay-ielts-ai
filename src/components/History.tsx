
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Headphones, 
  BookOpen, 
  PenTool, 
  Mic, 
  FileText,
  Calendar,
  Clock,
  Play,
  Eye,
  Brain
} from 'lucide-react';

interface HistoryProps {
  onViewChange?: (view: string) => void;
  onStartSession?: (sessionId: string, skillType: string) => void;
}

interface CombinedSession {
  id: string;
  skill_type: string;
  score?: number;
  ai_feedback?: string | any;
  completed_at?: string;
  created_at: string;
  session_type: 'practice' | 'ai_test';
  overall_band_score?: number;
  band_scores?: any;
}

const History: React.FC<HistoryProps> = ({ onViewChange, onStartSession }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('all');
  const [combinedHistory, setCombinedHistory] = useState<CombinedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<CombinedSession | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (user) {
      loadCombinedHistory();
    }
  }, [user]);

  const loadCombinedHistory = async () => {
    try {
      // Load practice sessions
      const { data: practiceSessions, error: practiceError } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Load AI test sessions
      const { data: aiSessions, error: aiError } = await supabase
        .from('ai_test_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (practiceError) throw practiceError;
      if (aiError) throw aiError;

      // Combine and format sessions
      const combined: CombinedSession[] = [
        ...(practiceSessions || []).map(session => ({
          id: session.id,
          skill_type: session.skill_type,
          score: session.score,
          ai_feedback: session.ai_feedback,
          completed_at: session.completed_at,
          created_at: session.created_at,
          session_type: 'practice' as const
        })),
        ...(aiSessions || []).map(session => ({
          id: session.id,
          skill_type: session.skill_type,
          score: session.overall_band_score,
          ai_feedback: session.ai_feedback,
          completed_at: session.completed_at,
          created_at: session.created_at,
          session_type: 'ai_test' as const,
          overall_band_score: session.overall_band_score,
          band_scores: session.band_scores
        }))
      ];

      // Sort by creation date (newest first)
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCombinedHistory(combined);
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: "Error",
        description: "Failed to load practice history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSession = async (session: CombinedSession) => {
    setSelectedSession(session);
    setShowReview(true);
  };

  const handleContinueSession = async (session: CombinedSession) => {
    if (onStartSession) {
      onStartSession(session.id, session.skill_type);
    } else if (onViewChange) {
      // Store session ID in localStorage for continuation
      localStorage.setItem('continueSessionId', session.id);
      localStorage.setItem('continueSkillType', session.skill_type);
      onViewChange('ielts-ai');
    }
  };

  const getSkillIcon = (type: string) => {
    switch (type) {
      case 'listening': return <Headphones className="h-4 w-4" />;
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'writing': return <PenTool className="h-4 w-4" />;
      case 'speaking': return <Mic className="h-4 w-4" />;
      case 'mock-test': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getSkillColor = (type: string) => {
    switch (type) {
      case 'listening': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'reading': return 'bg-green-50 text-green-600 border-green-200';
      case 'writing': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'speaking': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'mock-test': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 7.0) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 6.0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderAIFeedback = (feedback: any) => {
    if (!feedback) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No feedback available for this session.</p>
        </div>
      );
    }

    // Handle both string and object feedback
    if (typeof feedback === 'string') {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="prose max-w-none">
            {feedback.split('\n').map((line: string, index: number) => {
              const trimmedLine = line.trim();
              
              if (trimmedLine.startsWith('OVERALL BAND SCORE:')) {
                return (
                  <div key={index} className="text-center mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h2 className="text-3xl font-bold text-blue-700 mb-2">
                      {trimmedLine.split(':')[1]?.trim() || 'N/A'}
                    </h2>
                    <p className="text-gray-600">Band Score</p>
                  </div>
                );
              }
              
              if (trimmedLine.match(/^(DETAILED ASSESSMENT|STRENGTHS|AREAS FOR IMPROVEMENT|RECOMMENDATIONS|EXAMINER COMMENTS):?$/)) {
                return (
                  <div key={index} className="mt-6 mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2">
                      {trimmedLine.replace(':', '')}
                    </h3>
                  </div>
                );
              }
              
              if (trimmedLine.startsWith('-')) {
                return (
                  <div key={index} className="flex items-start mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">{trimmedLine.substring(1).trim()}</p>
                  </div>
                );
              }
              
              if (trimmedLine) {
                return (
                  <p key={index} className="text-gray-700 mb-3 leading-relaxed">
                    {trimmedLine}
                  </p>
                );
              }
              
              return null;
            })}
          </div>
        </div>
      );
    }

    // Handle structured feedback object
    return (
      <div className="space-y-6">
        {/* Overall Score */}
        {feedback.overall_score && (
          <div className="text-center mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-3xl font-bold text-blue-700 mb-2">
              {feedback.overall_score}
            </h2>
            <p className="text-gray-600">Overall Band Score</p>
          </div>
        )}

        {/* Category Scores */}
        {feedback.category_scores && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(feedback.category_scores).map(([category, score]) => (
              <div key={category} className="bg-white border-2 border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 capitalize">
                    {category.replace(/_/g, ' ')}
                  </h3>
                  <span className="text-2xl font-bold text-blue-600">
                    {score as number}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((score as number) / 9) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strengths */}
        {feedback.strengths && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Strengths</h3>
            <ul className="space-y-2">
              {feedback.strengths.map((strength: string, index: number) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {feedback.improvements && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">Areas for Improvement</h3>
            <ul className="space-y-2">
              {feedback.improvements.map((improvement: string, index: number) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Feedback */}
        {feedback.detailed_feedback && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Analysis</h3>
            <p className="text-gray-700 leading-relaxed">{feedback.detailed_feedback}</p>
          </div>
        )}
      </div>
    );
  };

  const filteredHistory = selectedTab === 'all' 
    ? combinedHistory 
    : combinedHistory.filter(item => item.skill_type === selectedTab);

  if (showReview && selectedSession) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setShowReview(false)}>
            Back to History
          </Button>
          <Badge className="bg-blue-100 text-blue-700">
            Session Review
          </Badge>
          {selectedSession.session_type === 'ai_test' && (
            <Badge className="bg-purple-100 text-purple-700">
              <Brain className="h-3 w-3 mr-1" />
              AI Test
            </Badge>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl">
              {selectedSession.skill_type.charAt(0).toUpperCase() + selectedSession.skill_type.slice(1)} Test Review
            </CardTitle>
            <p className="text-gray-600">
              Completed on {formatDate(selectedSession.completed_at || selectedSession.created_at)}
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {renderAIFeedback(selectedSession.ai_feedback)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice History</h1>
        <p className="text-gray-600">Review all your practice sessions and track your progress</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-sky-600">{combinedHistory.length}</div>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {combinedHistory.filter(s => s.completed_at).length}
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {combinedHistory.length > 0 ? 
                (combinedHistory.filter(s => s.score).reduce((acc, s) => acc + (s.score || 0), 0) / 
                 combinedHistory.filter(s => s.score).length).toFixed(1) : '0.0'}
            </div>
            <p className="text-sm text-gray-600">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {combinedHistory.filter(s => !s.completed_at).length}
            </div>
            <p className="text-sm text-gray-600">In Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="listening">Listening</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="writing">Writing</TabsTrigger>
          <TabsTrigger value="speaking">Speaking</TabsTrigger>
          <TabsTrigger value="mock-test">Mock Tests</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((session) => (
                <Card key={`${session.session_type}-${session.id}`} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`px-3 py-2 rounded-lg ${getSkillColor(session.skill_type)}`}>
                          {getSkillIcon(session.skill_type)}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">
                              {session.skill_type.charAt(0).toUpperCase() + session.skill_type.slice(1)} Test
                            </h3>
                            {session.session_type === 'ai_test' && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                <Brain className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(session.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {session.completed_at ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          {session.completed_at && session.score && (
                            <Badge className={`${getScoreColor(session.score)} border font-bold mb-2`}>
                              {session.score}/9.0
                            </Badge>
                          )}
                          {!session.completed_at && (
                            <Badge variant="secondary">In Progress</Badge>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          {session.completed_at && session.ai_feedback ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReviewSession(session)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          ) : !session.completed_at ? (
                            <Button 
                              size="sm" 
                              className="bg-sky-500 hover:bg-sky-600"
                              onClick={() => handleContinueSession(session)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Continue
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              No Feedback
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredHistory.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No practice sessions yet</h3>
                  <p className="text-gray-500">Start practicing to see your history here.</p>
                  {onViewChange && (
                    <Button 
                      className="mt-4 bg-sky-500 hover:bg-sky-600"
                      onClick={() => onViewChange('ielts-ai')}
                    >
                      Start Practicing
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;
