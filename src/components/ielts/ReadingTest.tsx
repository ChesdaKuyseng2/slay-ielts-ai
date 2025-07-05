
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, HelpCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReadingTestProps {
  testData: any;
  sessionId: string;
  onComplete: (answers: any) => void;
  onExplainAnswer: (questionIndex: number) => void;
}

const ReadingTest: React.FC<ReadingTestProps> = ({ 
  testData, 
  sessionId, 
  onComplete, 
  onExplainAnswer 
}) => {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: "Time's Up!",
            description: "Your test has been automatically submitted.",
            variant: "destructive"
          });
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('Submitting reading test with answers:', answers);
      // Ensure we have valid answers structure
      const validAnswers = {
        ...answers,
        sessionId,
        completedAt: new Date().toISOString()
      };
      await onComplete(validAnswers);
    } catch (error) {
      console.error('Error submitting reading test:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your test. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  // Use AI-generated content if available, otherwise fallback
  const passage = testData?.passage || `
    <h3>The Impact of Technology on Modern Education</h3>
    <p><strong>A</strong> The integration of technology in educational settings has revolutionized the way students learn and teachers instruct. From interactive whiteboards to online learning platforms, technology has become an indispensable tool in modern education. This transformation has not only changed the physical classroom environment but has also redefined the roles of both educators and learners.</p>
    
    <p><strong>B</strong> Research indicates that students who use technology-enhanced learning methods show improved engagement and retention rates compared to traditional teaching methods. Interactive software, virtual reality experiences, and gamified learning platforms have made complex subjects more accessible and enjoyable for students across all age groups. However, the effectiveness largely depends on how well the technology is integrated into the curriculum and the teacher's ability to adapt their teaching methods accordingly.</p>
    
    <p><strong>C</strong> Despite the numerous benefits, some educators argue that excessive reliance on technology may diminish critical thinking skills and face-to-face interaction among students. The concern is that students might become too dependent on digital tools for problem-solving, potentially affecting their ability to think independently. Additionally, the digital divide continues to be a significant challenge, as not all students have equal access to technological resources.</p>
    
    <p><strong>D</strong> Looking toward the future, the challenge lies in finding the right balance between technological advancement and traditional pedagogical approaches. Educational institutions must carefully consider how to implement technology in ways that enhance rather than replace fundamental teaching practices. The goal should be to use technology as a tool to support and amplify human learning, not to substitute the essential human elements of education.</p>
  `;

  // Fixed questions array - exactly 10 questions
  const questions = testData?.questions || [
    'Technology has completely replaced traditional teaching methods in all schools.',
    'Students show better engagement with technology-enhanced learning according to research.',
    'All educators support the unlimited use of technology in classrooms.',
    'The digital divide affects equal access to technological resources for students.',
    'Finding the right balance between technology and traditional methods is a current challenge.',
    'Interactive software has made learning more enjoyable for students.',
    'Virtual reality is mentioned as being used only in higher education.',
    'The effectiveness of technology depends on proper curriculum integration.',
    'Face-to-face interaction has completely disappeared from modern classrooms.',
    'Educational institutions must consider careful implementation of technology.'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Timer */}
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Time Remaining:</span>
            </div>
            <Badge variant={timeLeft < 600 ? "destructive" : "default"} className="text-lg px-3 py-1">
              {formatTime(timeLeft)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reading Passage */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Reading Passage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-sm leading-relaxed bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: passage }} />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Questions 1-10</CardTitle>
            <p className="text-sm text-gray-600">
              Read the passage and answer the questions below.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* True/False/Not Given Questions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-600">Questions 1-8: True/False/Not Given</h3>
              <p className="text-sm text-gray-600 mb-4">
                Write TRUE if the statement agrees with the information<br/>
                Write FALSE if the statement contradicts the information<br/>
                Write NOT GIVEN if there is no information on this
              </p>
              
              {questions.slice(0, 8).map((statement, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="mb-2">{index + 1}. {statement}</p>
                      <div className="flex space-x-4">
                        {['TRUE', 'FALSE', 'NOT GIVEN'].map(option => (
                          <label key={option} className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`tfng_${index}`}
                              value={option}
                              checked={answers[`tfng_${index}`] === option}
                              onChange={(e) => handleAnswerChange(`tfng_${index}`, e.target.value)}
                              className="text-blue-600"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExplainAnswer(index)}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Completion */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-semibold text-blue-600">Questions 9-10: Summary Completion</h3>
              <p className="text-sm text-gray-600">Complete the summary using words from the passage.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  9. The integration of technology in education has{' '}
                  <Input 
                    className="inline-block w-32 mx-1 h-6 text-xs"
                    value={answers['summary_1'] || ''}
                    onChange={(e) => handleAnswerChange('summary_1', e.target.value)}
                    placeholder="word 1"
                  />{' '}
                  the way students learn.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  10. However, some educators worry about excessive{' '}
                  <Input 
                    className="inline-block w-32 mx-1 h-6 text-xs"
                    value={answers['summary_2'] || ''}
                    onChange={(e) => handleAnswerChange('summary_2', e.target.value)}
                    placeholder="word 2"
                  />{' '}
                  on digital tools.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                Progress: {Object.keys(answers).length} / 10 answered
              </div>
              <Button 
                onClick={handleSubmit} 
                size="lg" 
                className="bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answers'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReadingTest;
