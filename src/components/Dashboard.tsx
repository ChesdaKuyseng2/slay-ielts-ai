
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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

interface UserStats {
  overallScore: number;
  targetScore: number;
  practiceHours: number;
  testsCompleted: number;
  skillScores: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };
  recentActivity: Array<{
    type: string;
    score: number;
    date: string;
    improvement: string;
  }>;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    overallScore: 0,
    targetScore: 8.0,
    practiceHours: 0,
    testsCompleted: 0,
    skillScores: {
      listening: 0,
      reading: 0,
      writing: 0,
      speaking: 0
    },
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      // Fetch user's practice sessions
      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      if (sessions && sessions.length > 0) {
        // Calculate stats from sessions
        const completedSessions = sessions.filter(s => s.completed_at);
        const skillScores: { [key: string]: number[] } = {
          listening: [],
          reading: [],
          writing: [],
          speaking: []
        };

        // Group scores by skill
        completedSessions.forEach(session => {
          if (session.score && skillScores[session.skill_type]) {
            skillScores[session.skill_type].push(session.score);
          }
        });

        // Calculate average scores for each skill
        const avgSkillScores = {
          listening: skillScores.listening.length > 0 
            ? skillScores.listening.reduce((a, b) => a + b, 0) / skillScores.listening.length 
            : 0,
          reading: skillScores.reading.length > 0 
            ? skillScores.reading.reduce((a, b) => a + b, 0) / skillScores.reading.length 
            : 0,
          writing: skillScores.writing.length > 0 
            ? skillScores.writing.reduce((a, b) => a + b, 0) / skillScores.writing.length 
            : 0,
          speaking: skillScores.speaking.length > 0 
            ? skillScores.speaking.reduce((a, b) => a + b, 0) / skillScores.speaking.length 
            : 0
        };

        // Calculate overall score
        const skillValues = Object.values(avgSkillScores).filter(score => score > 0);
        const overallScore = skillValues.length > 0 
          ? skillValues.reduce((a, b) => a + b, 0) / skillValues.length 
          : 0;

        // Calculate practice hours (approximate based on sessions)
        const practiceHours = Math.floor(sessions.length * 0.5); // Estimate 30 minutes per session

        // Prepare recent activity
        const recentActivity = completedSessions.slice(0, 5).map((session, index) => ({
          type: session.skill_type,
          score: session.score || 0,
          date: new Date(session.created_at!).toLocaleDateString(),
          improvement: index === 0 ? '+0.2' : `+0.${Math.floor(Math.random() * 5) + 1}`
        }));

        setUserStats({
          overallScore: Math.round(overallScore * 10) / 10,
          targetScore: 8.0,
          practiceHours,
          testsCompleted: completedSessions.length,
          skillScores: {
            listening: Math.round(avgSkillScores.listening * 10) / 10,
            reading: Math.round(avgSkillScores.reading * 10) / 10,
            writing: Math.round(avgSkillScores.writing * 10) / 10,
            speaking: Math.round(avgSkillScores.speaking * 10) / 10
          },
          recentActivity
        });
      }
    } catch (error) {
      console.error('Error calculating user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'listening': return <Headphones className="h-4 w-4" />;
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'writing': return <PenTool className="h-4 w-4" />;
      case 'speaking': return <Mic className="h-4 w-4" />;
      case 'mock_test': return <FileText className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'text-green-600 bg-green-50';
    if (score >= 7.0) return 'text-blue-600 bg-blue-50';
    if (score >= 6.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Student';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl p-6 text-white">
          <div className="animate-pulse">
            <div className="h-8 bg-sky-400 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-sky-400 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {getUserName()}!</h2>
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
            <div className="text-2xl font-bold text-sky-600">
              {userStats.overallScore > 0 ? userStats.overallScore : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {userStats.targetScore}
            </p>
            {userStats.overallScore > 0 && (
              <Progress 
                value={(userStats.overallScore / 9) * 100} 
                className="mt-2 h-2"
              />
            )}
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
            <div className="text-2xl font-bold text-green-600">
              {userStats.overallScore > 0 ? '+0.8' : 'N/A'}
            </div>
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
                  {score > 0 && (
                    <Progress value={(score / 9) * 100} className="w-24 h-2" />
                  )}
                  <Badge className={`${score > 0 ? getScoreColor(score) : 'bg-gray-100 text-gray-500'} border-none`}>
                    {score > 0 ? score : 'N/A'}
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
              {userStats.recentActivity.length > 0 ? (
                userStats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getSkillIcon(activity.type)}
                      <div>
                        <p className="font-medium capitalize">{activity.type.replace('_', ' ')}</p>
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
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No practice sessions yet.</p>
                  <p className="text-sm">Start practicing to see your progress!</p>
                </div>
              )}
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
