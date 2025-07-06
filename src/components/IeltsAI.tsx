
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProfessionalPracticeSession from './ProfessionalPracticeSession';
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
  TrendingUp,
  Zap,
  Target,
  Award,
  Brain
} from 'lucide-react';

interface IeltsAIProps {
  onViewChange: (view: string) => void;
}

const IeltsAI: React.FC<IeltsAIProps> = ({ onViewChange }) => {
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'quick' | 'ai'>('quick');

  const skills = [
    {
      id: 'listening',
      title: 'Listening Test',
      icon: <Headphones className="h-8 w-8" />,
      description: 'Professional IELTS Listening test with audio recordings and authentic question types',
      features: ['Audio playback controls', 'Multiple choice & fill-in-the-blank', 'Real-time transcript', 'Instant scoring'],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      lastScore: 7.8,
      sessionsCompleted: 15,
      timeEstimate: '30 minutes'
    },
    {
      id: 'reading',
      title: 'Reading Test',
      icon: <BookOpen className="h-8 w-8" />,
      description: 'Authentic IELTS Reading passages with comprehensive question varieties',
      features: ['Academic passages', 'T/F/NG questions', 'Multiple choice & matching', 'Time management'],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      lastScore: 7.2,
      sessionsCompleted: 12,
      timeEstimate: '60 minutes'
    },
    {
      id: 'writing',
      title: 'Writing Test',
      icon: <PenTool className="h-8 w-8" />,
      description: 'Complete IELTS Writing tasks with AI-powered feedback and band scoring',
      features: ['Task 1 & Task 2', 'Word count tracking', 'Auto-save progress', 'Detailed feedback'],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      lastScore: 7.0,
      sessionsCompleted: 8,
      timeEstimate: '60 minutes'
    },
    {
      id: 'speaking',
      title: 'Speaking Test',
      icon: <Mic className="h-8 w-8" />,
      description: 'Full IELTS Speaking test simulation with voice recording and AI analysis',
      features: ['3-part structure', 'Voice recording', 'Cue card topics', 'Fluency analysis'],
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      lastScore: 7.8,
      sessionsCompleted: 10,
      timeEstimate: '15 minutes'
    }
  ];

  const handleStartQuick = (skillId: string) => {
    console.log(`Starting quick ${skillId} session`);
    setCurrentSession(skillId);
    setSessionType('quick');
  };

  const handleStartAI = (skillId: string) => {
    console.log(`Starting AI ${skillId} session`);
    setCurrentSession(skillId);
    setSessionType('ai');
  };

  const handleBackToSkills = () => {
    setCurrentSession(null);
  };

  if (currentSession) {
    if (sessionType === 'ai') {
      return (
        <PracticeSession 
          skillType={currentSession} 
          onBack={handleBackToSkills}
        />
      );
    } else {
      return (
        <ProfessionalPracticeSession 
          skill={currentSession} 
          duration={1800} // 30 minutes
          onComplete={handleBackToSkills}
        />
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IELTS AI Practice</h1>
        <p className="text-gray-600">Professional IELTS test simulation with AI-powered feedback and scoring</p>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-700">AI-Powered</p>
                <p className="text-sm text-gray-600">Instant feedback & scoring</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-700">Authentic Tests</p>
                <p className="text-sm text-gray-600">Real IELTS format</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-purple-700">Band Scoring</p>
                <p className="text-sm text-gray-600">Official IELTS bands 0-9</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {skills.map((skill) => (
          <Card 
            key={skill.id} 
            className="group hover:shadow-lg transition-all duration-300"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${skill.bgColor} group-hover:scale-110 transition-transform`}>
                  <div className={skill.textColor}>
                    {skill.icon}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`${skill.bgColor} ${skill.textColor} border-none mb-2`}>
                    Band {skill.lastScore}
                  </Badge>
                  <p className="text-xs text-gray-500">{skill.timeEstimate}</p>
                </div>
              </div>
              <CardTitle className="text-xl font-bold">{skill.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">{skill.description}</p>
              
              {/* Features */}
              <div className="grid grid-cols-2 gap-2">
                {skill.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full mr-2"></div>
                    {feature}
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{skill.sessionsCompleted} completed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Best: {skill.lastScore}/9</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button 
                  className={`w-full bg-gradient-to-r ${skill.color} hover:opacity-90 group-hover:scale-105 transition-transform text-sm`}
                  onClick={() => handleStartQuick(skill.id)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Quick Test
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-2 hover:bg-purple-50 text-sm"
                  onClick={() => handleStartAI(skill.id)}
                >
                  <Brain className="h-3 w-3 mr-1" />
                  AI Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Practice Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Practice Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { skill: 'Listening Test', date: '2024-01-15', score: 8.0, duration: '28 min', status: 'Completed', improvement: '+0.3' },
              { skill: 'Writing Test', date: '2024-01-14', score: 7.5, duration: '58 min', status: 'Completed', improvement: '+0.5' },
              { skill: 'Reading Test', date: '2024-01-13', score: 7.8, duration: '55 min', status: 'Completed', improvement: '+0.2' },
              { skill: 'Speaking Test', date: '2024-01-12', score: 8.0, duration: '14 min', status: 'Completed', improvement: '+0.4' }
            ].map((session, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{session.score}</span>
                  </div>
                  <div>
                    <p className="font-medium">{session.skill}</p>
                    <p className="text-sm text-gray-500">{session.date} • {session.duration}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {session.improvement} improvement
                  </Badge>
                  <Badge className="bg-green-100 text-green-700">
                    Band {session.score}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IeltsAI;
