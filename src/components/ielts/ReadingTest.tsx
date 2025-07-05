
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
          onComplete(answers);
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

  const handleSubmit = () => {
    onComplete(answers);
  };

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
              <div dangerouslySetInnerHTML={{ __html: testData.passage || `
                <h3>Climate Change and Its Effects</h3>
                <p><strong>A</strong> Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, human activities have been the main driver of climate change since the 1800s, primarily through the burning of fossil fuels like coal, oil, and gas.</p>
                
                <p><strong>B</strong> The greenhouse effect is a natural process that warms the Earth's surface. When the Sun's energy reaches the Earth's atmosphere, some of it is reflected back to space and the rest is absorbed and re-radiated by greenhouse gases. However, human activities have increased the concentration of these gases.</p>
                
                <p><strong>C</strong> The consequences of climate change are already visible worldwide. Rising global temperatures have led to melting ice caps, rising sea levels, and more frequent extreme weather events such as hurricanes, droughts, and floods. These changes pose significant threats to ecosystems, agriculture, and human settlements.</p>
                
                <p><strong>D</strong> Scientists agree that immediate action is necessary to mitigate the effects of climate change. This includes transitioning to renewable energy sources, improving energy efficiency, and implementing policies to reduce greenhouse gas emissions. International cooperation is essential for addressing this global challenge.</p>
              ` }} />
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
              <h3 className="font-semibold text-blue-600">Questions 1-5: True/False/Not Given</h3>
              <p className="text-sm text-gray-600 mb-4">
                Write TRUE if the statement agrees with the information<br/>
                Write FALSE if the statement contradicts the information<br/>
                Write NOT GIVEN if there is no information on this
              </p>
              
              {[
                "Climate change is only caused by natural factors.",
                "Fossil fuels are the main cause of climate change since the 1800s.",
                "The greenhouse effect is entirely artificial.",
                "Climate change effects are already observable worldwide.",
                "All countries have agreed on climate change policies."
              ].map((statement, index) => (
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

            {/* Multiple Choice Questions */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-semibold text-blue-600">Questions 6-8: Multiple Choice</h3>
              
              {[
                {
                  question: "According to the passage, the main driver of climate change since the 1800s has been:",
                  options: ["Natural climate variations", "Human activities", "Solar radiation", "Ocean currents"]
                },
                {
                  question: "The greenhouse effect is described as:",
                  options: ["A harmful process", "A natural process", "An artificial process", "An unknown process"]
                },
                {
                  question: "The passage suggests that addressing climate change requires:",
                  options: ["Individual action only", "Government policies only", "International cooperation", "Technological solutions only"]
                }
              ].map((q, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium mb-2">{index + 6}. {q.question}</p>
                      <div className="space-y-1">
                        {q.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`mc_${index + 5}`}
                              value={option}
                              onChange={(e) => handleAnswerChange(`mc_${index + 5}`, e.target.value)}
                              className="text-blue-600"
                            />
                            <span className="text-sm">{String.fromCharCode(65 + optIndex)}. {option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExplainAnswer(index + 5)}
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
                  Climate change has been primarily driven by <Input 
                    className="inline-block w-32 mx-1 h-6 text-xs"
                    value={answers['summary_1'] || ''}
                    onChange={(e) => handleAnswerChange('summary_1', e.target.value)}
                  /> since the 1800s. The effects include rising sea levels and more frequent 
                  <Input 
                    className="inline-block w-32 mx-1 h-6 text-xs"
                    value={answers['summary_2'] || ''}
                    onChange={(e) => handleAnswerChange('summary_2', e.target.value)}
                  /> weather events.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                Progress: {Object.keys(answers).length} / 10 answered
              </div>
              <Button onClick={handleSubmit} size="lg" className="bg-green-600 hover:bg-green-700">
                Submit Answers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReadingTest;
