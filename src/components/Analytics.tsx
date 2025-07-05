
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Globe,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Star
} from 'lucide-react';

const Analytics: React.FC = () => {
  // Mock data for top performers
  const topPerformers = [
    { rank: 1, name: 'Sarah Chen', country: 'Singapore', score: 8.5, avatar: 'SC' },
    { rank: 2, name: 'Ahmed Hassan', country: 'Egypt', score: 8.3, avatar: 'AH' },
    { rank: 3, name: 'Maria Garcia', country: 'Spain', score: 8.2, avatar: 'MG' },
    { rank: 4, name: 'John Smith', country: 'Canada', score: 8.1, avatar: 'JS' },
    { rank: 5, name: 'Lisa Wang', country: 'China', score: 8.0, avatar: 'LW' }
  ];

  const countryStats = [
    { country: 'China', users: 1250, avgScore: 7.2, flag: '🇨🇳' },
    { country: 'India', users: 980, avgScore: 7.0, flag: '🇮🇳' },
    { country: 'Spain', users: 750, avgScore: 7.4, flag: '🇪🇸' },
    { country: 'Egypt', users: 620, avgScore: 7.1, flag: '🇪🇬' },
    { country: 'Brazil', users: 580, avgScore: 6.9, flag: '🇧🇷' }
  ];

  const skillLeaderboard = [
    { skill: 'Listening', icon: <Headphones className="h-4 w-4" />, topScore: 8.8, topUser: 'Sarah Chen', avgScore: 7.3 },
    { skill: 'Reading', icon: <BookOpen className="h-4 w-4" />, topScore: 8.6, topUser: 'Ahmed Hassan', avgScore: 7.1 },
    { skill: 'Writing', icon: <PenTool className="h-4 w-4" />, topScore: 8.4, topUser: 'Maria Garcia', avgScore: 6.8 },
    { skill: 'Speaking', icon: <Mic className="h-4 w-4" />, topScore: 8.7, topUser: 'John Smith', avgScore: 7.0 }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'text-green-600 bg-green-50';
    if (score >= 7.0) return 'text-blue-600 bg-blue-50';
    if (score >= 6.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-sky-100 text-sky-800 border-sky-200';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Global IELTS performance insights and leaderboards</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">
              Active countries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Star className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.1</div>
            <p className="text-xs text-muted-foreground">
              Global average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+0.3</div>
            <p className="text-xs text-muted-foreground">
              Monthly average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Top Performers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((user) => (
                <div key={user.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getRankBadgeColor(user.rank)} w-8 h-8 rounded-full flex items-center justify-center p-0`}>
                      {user.rank}
                    </Badge>
                    <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center font-medium text-sky-600">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.country}</p>
                    </div>
                  </div>
                  <Badge className={`${getScoreColor(user.score)} border-none font-bold`}>
                    {user.score}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Country Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-sky-500" />
              <span>Top Countries</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {countryStats.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <p className="font-medium">{country.country}</p>
                      <p className="text-sm text-gray-500">{country.users} users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getScoreColor(country.avgScore)} border-none`}>
                      {country.avgScore}
                    </Badge>
                    <Progress 
                      value={(country.avgScore / 9) * 100} 
                      className="w-16 h-1.5 mt-1" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill-based Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {skillLeaderboard.map((skill, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="text-sky-600">{skill.icon}</div>
                  <h3 className="font-semibold">{skill.skill}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Top Score:</span>
                    <Badge className="bg-green-100 text-green-700 border-none">
                      {skill.topScore}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{skill.topUser}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average:</span>
                    <span className="text-sm font-medium">{skill.avgScore}</span>
                  </div>
                  <Progress 
                    value={(skill.avgScore / 9) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personal Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Your Global Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg">
              <Trophy className="h-8 w-8 text-sky-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-sky-600">#247</div>
              <p className="text-sm text-gray-600">Global Rank</p>
              <p className="text-xs text-gray-500 mt-1">Top 2%</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <Globe className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">#12</div>
              <p className="text-sm text-gray-600">Country Rank</p>
              <p className="text-xs text-gray-500 mt-1">Canada</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">+43</div>
              <p className="text-sm text-gray-600">Rank Change</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
