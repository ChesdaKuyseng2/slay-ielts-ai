
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, FileText, BarChart3, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WritingTestProps {
  testData: any;
  sessionId: string;
  onComplete: (response: any) => void;
  onSave: (response: any) => void;
}

const WritingTest: React.FC<WritingTestProps> = ({ 
  testData, 
  sessionId, 
  onComplete, 
  onSave 
}) => {
  const { toast } = useToast();
  const [task1Response, setTask1Response] = useState('');
  const [task2Response, setTask2Response] = useState('');
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const [wordCounts, setWordCounts] = useState({ task1: 0, task2: 0 });
  const [autoSaved, setAutoSaved] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (task1Response || task2Response) {
        onSave({ task1: task1Response, task2: task2Response });
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [task1Response, task2Response]);

  const countWords = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const handleTask1Change = (value: string) => {
    setTask1Response(value);
    setWordCounts(prev => ({ ...prev, task1: countWords(value) }));
  };

  const handleTask2Change = (value: string) => {
    setTask2Response(value);
    setWordCounts(prev => ({ ...prev, task2: countWords(value) }));
  };

  const handleSubmit = () => {
    onComplete({ 
      task1: task1Response, 
      task2: task2Response,
      wordCounts 
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Timer and Progress */}
      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Time Remaining:</span>
                <Badge variant={timeLeft < 600 ? "destructive" : "default"} className="text-lg px-3 py-1">
                  {formatTime(timeLeft)}
                </Badge>
              </div>
              {autoSaved && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Save className="h-3 w-3 mr-1" />
                  Auto-saved
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium">Task 1:</span> {wordCounts.task1} words
                <span className={wordCounts.task1 < 150 ? "text-red-500 ml-1" : "text-green-500 ml-1"}>
                  (min. 150)
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Task 2:</span> {wordCounts.task2} words
                <span className={wordCounts.task2 < 250 ? "text-red-500 ml-1" : "text-green-500 ml-1"}>
                  (min. 250)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="task1" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="task1" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Task 1 (20 minutes recommended)</span>
          </TabsTrigger>
          <TabsTrigger value="task2" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Task 2 (40 minutes recommended)</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="task1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">Writing Task 1</CardTitle>
              <p className="text-sm text-gray-600">
                You should spend about 20 minutes on this task. Write at least 150 words.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm font-medium mb-2">Task:</p>
                <p className="text-sm">
                  {testData.task1?.prompt || `
                  The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.
                  
                  Summarise the information by selecting and reporting the main features, and make comparisons where relevant.
                  `}
                </p>
                {testData.task1?.image && (
                  <div className="mt-4">
                    <img 
                      src={testData.task1.image} 
                      alt="Chart for Task 1" 
                      className="max-w-full h-auto border rounded"
                    />
                  </div>
                )}
              </div>
              
              <Textarea
                placeholder="Write your response here..."
                value={task1Response}
                onChange={(e) => handleTask1Change(e.target.value)}
                className="min-h-80 text-sm"
              />
              
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Word count: {wordCounts.task1}</span>
                <Button 
                  variant="outline" 
                  onClick={() => onSave({ task1: task1Response, task2: task2Response })}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="task2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">Writing Task 2</CardTitle>
              <p className="text-sm text-gray-600">
                You should spend about 40 minutes on this task. Write at least 250 words.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <p className="text-sm font-medium mb-2">Task:</p>
                <p className="text-sm">
                  {testData.task2?.prompt || `
                  Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer.
                  
                  What, in your opinion, should be the main function of a university?
                  
                  Give reasons for your answer and include any relevant examples from your own knowledge or experience.
                  `}
                </p>
              </div>
              
              <Textarea
                placeholder="Write your essay here..."
                value={task2Response}
                onChange={(e) => handleTask2Change(e.target.value)}
                className="min-h-96 text-sm"
              />
              
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Word count: {wordCounts.task2}</span>
                <Button 
                  variant="outline" 
                  onClick={() => onSave({ task1: task1Response, task2: task2Response })}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center pt-6">
        <Button 
          onClick={handleSubmit} 
          size="lg" 
          className="bg-green-600 hover:bg-green-700"
          disabled={wordCounts.task1 < 150 || wordCounts.task2 < 250}
        >
          Submit Writing Test
        </Button>
      </div>
    </div>
  );
};

export default WritingTest;
