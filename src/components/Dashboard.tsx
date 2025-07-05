
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  FileText
} from 'lucide-react';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  // Mock data - in real app this would come from API
  const userStats = {
    overallScore: 7.5,
    targetScore: 8.0,
    practiceHours: 45,
    testsCompleted: 12,
    skillScores: {
      listening: 7.8,
      reading: 7.2,
      writing: 7.0,
      speaking: 7.8
    },
    recentActivity: [
      { type: 'listening', score: 8.0, date: '2024-01-15', improvement: '+0.5' },
      { type: 'writing', score: 7.5, date: '2024-01-14', improvement: '+0.3' },
      { type: 'reading', score: 7.8, date: '2024-01-13', improvement: '+0.2' },
      { type: 'speaking', score: 8.0, date: '2024-01-12', improvement: '+0.4' },
      { type: 'mock-test', score: 7.6, date: '2024-01-11', improvement: '+0.1' }
    ]
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'listening': return <Headphones className="h-4 w-4" />;
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'writing': return <PenTool className="h-4 w-4" />;
      case 'speaking': return <Mic className="h-4 w-4" />;
      case 'mock-test': return <FileText className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'text-green-600 bg-green-50';
    if (score >= 7.0) return 'text-blue-600 bg-blue-50';
    if (score >= 6.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, John!</h2>
        <p className="text-sky-100">Ready to improve your IELTS skills today?</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Award className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600">{userStats.overallScore}</div>
            <p className="text-xs text-muted-foreground">
              Target: {userStats.targetScore}
            </p>
            <Progress 
              value={(userStats.overallScore / 9) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Hours</CardTitle>
            <Clock className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.practiceHours}h</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
            <Target className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.testsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+0.8</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(userStats.skillScores).map(([skill, score]) => (
              <div key={skill} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getSkillIcon(skill)}
                  <span className="capitalize font-medium">{skill}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={(score / 9) * 100} className="w-24 h-2" />
                  <Badge className={`${getScoreColor(score)} border-none`}>
                    {score}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getSkillIcon(activity.type)}
                    <div>
                      <p className="font-medium capitalize">{activity.type.replace('-', ' ')}</p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getScoreColor(activity.score)}>
                      {activity.score}
                    </Badge>
                    <p className="text-xs text-green-600 font-medium">{activity.improvement}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => onViewChange('ielts-ai')}
              className="bg-sky-500 hover:bg-sky-600"
            >
              Start Practice
            </Button>
            <Button 
              variant="outline"
              onClick={() => onViewChange('history')}
            >
              View History
            </Button>
            <Button 
              variant="outline"
              onClick={() => onViewChange('analytics')}
            >
              Full Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
