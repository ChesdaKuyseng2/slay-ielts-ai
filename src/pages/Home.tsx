import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, BookOpen, Award, Globe, Sparkles, Play, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    { icon: BookOpen, title: "AI-Powered Practice", description: "Practice all 4 IELTS skills with advanced AI feedback" },
    { icon: Award, title: "Mock Tests", description: "Full-length practice tests with detailed scoring" },
    { icon: Users, title: "Progress Tracking", description: "Monitor your improvement with detailed analytics" },
    { icon: Globe, title: "Expert Feedback", description: "Get professional insights on your performance" }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      duration: "Forever",
      features: [
        "Limited practice tests (2-3 per skill)",
        "Basic scoring",
        "No AI feedback",
        "No mock tests"
      ],
      limitations: true,
      buttonText: "Get Started Free"
    },
    {
      name: "Premium Monthly",
      price: "$9.99",
      duration: "/month",
      features: [
        "Unlimited AI practice",
        "Full mock tests with AI scoring",
        "Advanced analytics dashboard",
        "AI speaking feedback",
        "Resume practice sessions",
        "Leaderboards"
      ],
      popular: true,
      buttonText: "Start Premium"
    },
    {
      name: "Premium Yearly",
      price: "$79.99",
      duration: "/year",
      features: [
        "Everything in Monthly",
        "Save over 30%",
        "Free human essay review",
        "Priority support",
        "Advanced progress reports"
      ],
      bestDeal: true,
      buttonText: "Best Deal"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 animate-fade-in">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">IS</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">IELTSSlay</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/auth')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section with Blue Background and Animations */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 opacity-90"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-sky-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            <div className="flex justify-center mb-6">
              <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 animate-scale-in">
              Master IELTS with 
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent animate-pulse"> AI-Powered </span>
              Practice
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in delay-300">
              Get personalized feedback, unlimited practice, and expert guidance to achieve your target IELTS score. 
              Join thousands of successful test-takers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 animate-fade-in delay-500">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')} 
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl px-8 py-4 text-lg font-semibold transform transition-all duration-300 hover:scale-105"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Free Practice
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 shadow-xl px-8 py-4 text-lg backdrop-blur-sm bg-white/10 transform transition-all duration-300 hover:scale-105"
              >
                View Pricing
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-blue-100 animate-fade-in delay-700">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Star className="h-5 w-5 text-yellow-300 fill-current animate-pulse" />
                <span className="font-medium">4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Users className="h-5 w-5 text-blue-200" />
                <span className="font-medium">50,000+ Students</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Trophy className="h-5 w-5 text-yellow-300" />
                <span className="font-medium">95% Success Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive IELTS preparation powered by advanced AI technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-blue-100 hover:border-blue-200 group animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                <CardHeader>
                  <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-blue-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Start free or unlock unlimited practice with Premium
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in ${
                plan.popular ? 'border-blue-500 border-2 shadow-blue-100 shadow-2xl' : ''
              } ${
                plan.bestDeal ? 'border-green-500 border-2 shadow-green-100 shadow-2xl' : ''
              }`} style={{ animationDelay: `${index * 200}ms` }}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                {plan.bestDeal && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1">
                    Best Deal
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-blue-900">{plan.name}</CardTitle>
                  <div className="mt-6">
                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{plan.price}</span>
                    <span className="text-gray-500 text-lg">{plan.duration}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className={`h-5 w-5 ${plan.limitations ? 'text-gray-400' : 'text-green-500'} flex-shrink-0 mt-0.5`} />
                        <span className={`${plan.limitations ? 'text-gray-600' : 'text-gray-900'} leading-relaxed`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full py-3 text-lg font-semibold transform transition-all duration-300 hover:scale-105 ${
                      plan.popular || plan.bestDeal 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => navigate('/auth')}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Achieve Your Target Score?
            </h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Join thousands of successful IELTS candidates who chose IELTSSlay
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl px-10 py-4 text-xl font-bold transform transition-all duration-300 hover:scale-110"
            >
              <Sparkles className="h-6 w-6 mr-2" />
              Start Your Journey Today
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-blue-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-6 animate-fade-in">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">IS</span>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">IELTSSlay</span>
          </div>
          <p className="text-gray-400">&copy; 2024 IELTSSlay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
