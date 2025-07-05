
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, BookOpen, Award, Globe } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IS</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">IELTSSlay</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master IELTS with 
            <span className="text-sky-600"> AI-Powered </span>
            Practice
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get personalized feedback, unlimited practice, and expert guidance to achieve your target IELTS score. 
            Join thousands of successful test-takers worldwide.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" onClick={() => navigate('/auth')} className="bg-sky-600 hover:bg-sky-700">
              Start Free Practice
            </Button>
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </div>
          
          <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>50,000+ Students</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>95% Success Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive IELTS preparation powered by advanced AI technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-sky-600 mx-auto mb-4" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-600">
              Start free or unlock unlimited practice with Premium
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-sky-500 border-2' : ''} ${plan.bestDeal ? 'border-green-500 border-2' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-sky-600">
                    Most Popular
                  </Badge>
                )}
                {plan.bestDeal && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
                    Best Deal
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">{plan.duration}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className={`h-5 w-5 ${plan.limitations ? 'text-gray-400' : 'text-green-500'} flex-shrink-0 mt-0.5`} />
                        <span className={plan.limitations ? 'text-gray-600' : 'text-gray-900'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.popular || plan.bestDeal ? "default" : "outline"}
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

      {/* CTA Section */}
      <section className="py-16 bg-sky-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Achieve Your Target Score?
          </h2>
          <p className="text-xl text-sky-100 mb-8">
            Join thousands of successful IELTS candidates who chose IELTSSlay
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
            Start Your Journey Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IS</span>
            </div>
            <span className="text-2xl font-bold text-white">IELTSSlay</span>
          </div>
          <p>&copy; 2024 IELTSSlay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
