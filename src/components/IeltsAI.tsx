import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PracticeSession from './PracticeSession';
import { 
  Headphones, 
  BookOpen, 
  PenTool, 
  Mic, 
  FileText,
  Play,
  RotateCcw,
  Clock,
  TrendingUp
} from 'lucide-react';

interface IeltsAIProps {
  onViewChange: (view: string) => void;
}

const IeltsAI: React.FC<IeltsAIProps> = ({ onViewChange }) => {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const skills = [
    {
      id: 'listening',
      title: 'Listening AI',
      icon: <Headphones className="h-8 w-8" />,
      description: 'Auto-generated conversations and monologues with comprehension questions',
      features: ['Audio playback', '5-10 questions', 'Hint/transcript toggle', 'Auto-save sessions'],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      lastScore: 7.8,
      sessionsCompleted: 15
    },
    {
      id: 'reading',
      title: 'Reading AI',
      icon: <BookOpen className="h-8 w-8" />,
      description: 'IELTS-style reading passages with various question types',
      features: ['T/F/NG questions', 'MCQ', 'Matching headings', 'Auto-save progress'],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      lastScore: 7.2,
      sessionsCompleted: 12
    },
    {
      id: 'writing',
      title: 'Writing AI',
      icon: <PenTool className="h-8 w-8" />,
      description: 'Task 1 & 2 prompts with AI feedback and scoring',
      features: ['Rich-text editor', 'Grammar analysis', 'Coherence feedback', 'Task achievement'],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      lastScore: 7.0,
      sessionsCompleted: 8
    },
    {
      id: 'speaking',
      title: 'Speaking AI',
      icon: <Mic className="h-8 w-8" />,
      description: 'Part 1, 2, 3 tasks with voice recording and AI analysis',
      features: ['Voice recording', 'Fluency analysis', 'Pronunciation feedback', 'Grammar notes'],
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      lastScore: 7.8,
      sessionsCompleted: 10
    },
    {
      id: 'mock-test',
      title: 'Mock Test AI',
      icon: <FileText className="h-8 w-8" />,
      description: 'Full IELTS mock test with all four skills combined',
      features: ['Complete test session', 'All skill areas', 'Comprehensive scoring', 'Detailed feedback'],
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      lastScore: 7.4,
      sessionsCompleted: 3
    }
  ];

  const handleSkillSelect = (skillId: string) => {
    setSelectedSkill(skillId);
    console.log(`Selected skill: ${skillId}`);
  };

  const handleStartNew = (skillId: string) => {
    console.log(`Starting new ${skillId} session`);
    setCurrentSession(skillId);
  };

  const handleResumePrevious = (skillId: string) => {
    console.log(`Resuming previous ${skillId} session`);
    setCurrentSession(skillId);
  };

  const handleBackToSkills = () => {
    setCurrentSession(null);
    setSelectedSkill(null);
  };

  if (currentSession) {
    return (
      <PracticeSession 
        skillType={currentSession} 
        onBack={handleBackToSkills}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS AI Practice</h1>
        <p className="text-gray-600">Choose a skill to practice with AI-powered exercises</p>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <Card 
            key={skill.id} 
            className="skill-card cursor-pointer group"
            onClick={() => handleSkillSelect(skill.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${skill.bgColor} group-hover:scale-110 transition-transform`}>
                  <div className={skill.textColor}>
                    {skill.icon}
                  </div>
                </div>
                <Badge className={`${skill.bgColor} ${skill.textColor} border-none`}>
                  {skill.lastScore}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold">{skill.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">{skill.description}</p>
              
              {/* Features */}
              <div className="space-y-2">
                {skill.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-500">
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full mr-2"></div>
                    {feature}
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{skill.sessionsCompleted} sessions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Last: {skill.lastScore}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button 
                  size="sm" 
                  className={`flex-1 bg-gradient-to-r ${skill.color} hover:opacity-90`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartNew(skill.id);
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start New
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResumePrevious(skill.id);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Practice Sessions */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Recent Practice Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { skill: 'Listening AI', date: '2024-01-15', score: 8.0, duration: '25 min', status: 'Completed' },
                { skill: 'Writing AI', date: '2024-01-14', score: 7.5, duration: '45 min', status: 'In Progress' },
                { skill: 'Reading AI', date: '2024-01-13', score: 7.8, duration: '30 min', status: 'Completed' },
                { skill: 'Speaking AI', date: '2024-01-12', score: 8.0, duration: '15 min', status: 'Completed' }
              ].map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                    <div>
                      <p className="font-medium">{session.skill}</p>
                      <p className="text-sm text-gray-500">{session.date} • {session.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge 
                      variant={session.status === 'Completed' ? 'default' : 'secondary'}
                      className={session.status === 'Completed' ? 'bg-green-100 text-green-700' : ''}
                    >
                      {session.status}
                    </Badge>
                    {session.status === 'Completed' && (
                      <Badge className="bg-sky-100 text-sky-700">
                        {session.score}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IeltsAI;
