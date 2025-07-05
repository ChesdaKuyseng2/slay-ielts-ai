
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Headphones, 
  BookOpen, 
  PenTool, 
  Mic, 
  FileText,
  Calendar,
  Clock,
  Play,
  Eye
} from 'lucide-react';

const History: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('all');

  const practiceHistory = [
    {
      id: 1,
      type: 'listening',
      title: 'Conversation about University Life',
      date: '2024-01-15',
      duration: '25 min',
      score: 8.0,
      questions: 10,
      correct: 8,
      status: 'completed',
      aiGenerated: true
    },
    {
      id: 2,
      type: 'writing',
      title: 'Task 2: Technology and Education',
      date: '2024-01-14',
      duration: '45 min',
      score: 7.5,
      wordCount: 284,
      status: 'completed',
      aiGenerated: true
    },
    {
      id: 3,
      type: 'reading',
      title: 'Climate Change Research',
      date: '2024-01-13',
      duration: '30 min',
      score: 7.8,
      questions: 14,
      correct: 11,
      status: 'completed',
      aiGenerated: true
    },
    {
      id: 4,
      type: 'speaking',
      title: 'Part 2: Describe a memorable journey',
      date: '2024-01-12',
      duration: '15 min',
      score: 8.0,
      status: 'completed',
      aiGenerated: true
    },
    {
      id: 5,
      type: 'mock-test',
      title: 'Full IELTS Mock Test #3',
      date: '2024-01-11',
      duration: '3h 30min',
      score: 7.6,
      status: 'completed',
      breakdown: { listening: 7.5, reading: 7.8, writing: 7.2, speaking: 8.0 },
      aiGenerated: true
    },
    {
      id: 6,
      type: 'listening',
      title: 'Academic Lecture: Marine Biology',
      date: '2024-01-10',
      duration: '20 min',
      score: 7.5,
      questions: 8,
      correct: 6,
      status: 'in-progress',
      aiGenerated: true
    }
  ];

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

  const filteredHistory = selectedTab === 'all' 
    ? practiceHistory 
    : practiceHistory.filter(item => item.type === selectedTab);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice History</h1>
        <p className="text-gray-600">Review all your AI-generated practice sessions and track your progress</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-sky-600">24</div>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">18h</div>
            <p className="text-sm text-gray-600">Practice Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">7.5</div>
            <p className="text-sm text-gray-600">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">+0.8</div>
            <p className="text-sm text-gray-600">Improvement</p>
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
          <div className="space-y-4">
            {filteredHistory.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Skill Icon */}
                      <div className={`px-3 py-2 rounded-lg ${getSkillColor(session.type)}`}>
                        {getSkillIcon(session.type)}
                      </div>
                      
                      {/* Session Info */}
                      <div>
                        <h3 className="font-semibold text-lg">{session.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{session.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{session.duration}</span>
                          </div>
                          {session.aiGenerated && (
                            <Badge variant="outline" className="text-xs">
                              AI Generated
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score and Actions */}
                    <div className="flex items-center space-x-4">
                      {/* Score Info */}
                      <div className="text-right">
                        {session.status === 'completed' && (
                          <>
                            <Badge className={`${getScoreColor(session.score)} border font-bold mb-2`}>
                              {session.score}
                            </Badge>
                            <div className="text-sm text-gray-500">
                              {session.type === 'mock-test' && session.breakdown && (
                                <div className="space-y-1">
                                  <div>L:{session.breakdown.listening} R:{session.breakdown.reading}</div>
                                  <div>W:{session.breakdown.writing} S:{session.breakdown.speaking}</div>
                                </div>
                              )}
                              {(session.type === 'listening' || session.type === 'reading') && session.questions && (
                                <div>{session.correct}/{session.questions} correct</div>
                              )}
                              {session.type === 'writing' && session.wordCount && (
                                <div>{session.wordCount} words</div>
                              )}
                            </div>
                          </>
                        )}
                        {session.status === 'in-progress' && (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                        {session.status === 'in-progress' && (
                          <Button size="sm" className="bg-sky-500 hover:bg-sky-600">
                            <Play className="h-4 w-4 mr-2" />
                            Continue
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;
