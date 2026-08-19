'use client';

import React, { useState } from 'react';
import { Book, Code, Play } from 'lucide-react';
import CodePlayground from '../../components/interactive/CodePlayground';
import InteractiveExample from '../../components/interactive/InteractiveExample';
import QuizQuestion from '../../components/interactive/QuizQuestion';
import ProgressTracker from '../../components/interactive/ProgressTracker';

export default function InteractiveTutorialPage() {
  const [currentChapter, setCurrentChapter] = useState(0);
  
  // Sample tutorial data - this would come from your backend
  const tutorialChapters = [
    {
      title: "Introduction to Functions",
      name: "Functions Basics",
      estimatedTime: "15 min"
    },
    {
      title: "Variables and Data Types", 
      name: "Data Types",
      estimatedTime: "20 min"
    },
    {
      title: "Control Flow",
      name: "Loops and Conditions", 
      estimatedTime: "25 min"
    },
    {
      title: "Object-Oriented Programming",
      name: "Classes and Objects",
      estimatedTime: "30 min"
    }
  ];

  const sampleInteractiveExamples = [
    {
      title: "Create Your First Function",
      description: "Learn how to write and call functions in JavaScript",
      objective: "Write a function that greets a user by name",
      initialCode: `// Write a function called greetUser that takes a name parameter
// and returns a greeting message

function greetUser(name) {
  // Your code here
}

// Test your function
console.log(greetUser("Alice"));`,
      solution: `function greetUser(name) {
  return "Hello, " + name + "! Welcome to our tutorial!";
}

// Test your function
console.log(greetUser("Alice"));`,
      hints: [
        "Use the 'return' keyword to send back a value from your function",
        "You can combine strings using the '+' operator",
        "Don't forget to include the parameter 'name' in your greeting"
      ],
      language: "javascript",
      difficulty: "beginner"
    }
  ];

  const sampleQuizQuestions = [
    {
      question: "What does the following function return?",
      type: "code-output",
      codeSnippet: `function calculate(x, y) {
  return x * 2 + y;
}

console.log(calculate(3, 4));`,
      correctAnswer: "10",
      explanation: "The function multiplies x by 2 (3 * 2 = 6) then adds y (6 + 4 = 10)",
      difficulty: "beginner"
    },
    {
      question: "Which of the following is the correct way to define a function in JavaScript?",
      type: "multiple-choice",
      options: [
        "function myFunc() { }",
        "def myFunc(): ",
        "func myFunc() { }",
        "function = myFunc() { }"
      ],
      correctAnswer: 0,
      explanation: "In JavaScript, functions are defined using the 'function' keyword followed by the function name and parentheses.",
      difficulty: "beginner"
    }
  ];

  return (
    <div className="">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Book className="text-blue-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900">Interactive Tutorial</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Progress Tracker */}
          <div className="lg:col-span-1">
            <ProgressTracker
              chapters={tutorialChapters}
              currentChapter={currentChapter}
              onChapterSelect={setCurrentChapter}
              showStats={true}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-8 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Play className="text-white" size={32} />
                <h2 className="text-3xl font-bold">Interactive Learning Experience</h2>
              </div>
              <p className="text-lg opacity-90 mb-6">
                Learn by doing with interactive code examples, hands-on exercises, and instant feedback.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold mb-1">4</div>
                  <div className="text-sm opacity-80">Chapters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">15+</div>
                  <div className="text-sm opacity-80">Examples</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">90min</div>
                  <div className="text-sm opacity-80">Duration</div>
                </div>
              </div>
            </div>

            {/* Interactive Code Playground */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Code className="text-green-600" size={24} />
                <h3 className="text-xl font-semibold text-gray-900">Code Playground</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Try out JavaScript code in real-time. Experiment with functions, variables, and see immediate results.
              </p>
              <CodePlayground
                initialCode={`// Welcome to the interactive playground!
// Try writing some JavaScript code here

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci sequence:");
for (let i = 0; i < 8; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}`}
                language="javascript"
                title="JavaScript Playground"
              />
            </div>

            {/* Interactive Examples */}
            {sampleInteractiveExamples.map((example, index) => (
              <InteractiveExample
                key={index}
                title={example.title}
                description={example.description}
                objective={example.objective}
                initialCode={example.initialCode}
                solution={example.solution}
                hints={example.hints}
                language={example.language}
                difficulty={example.difficulty}
              />
            ))}

            {/* Quiz Questions */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Book className="text-purple-600" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Knowledge Check</h3>
              </div>
              
              {sampleQuizQuestions.map((quiz, index) => (
                <QuizQuestion
                  key={index}
                  question={quiz.question}
                  type={quiz.type}
                  options={quiz.options}
                  correctAnswer={quiz.correctAnswer}
                  explanation={quiz.explanation}
                  codeSnippet={quiz.codeSnippet}
                  difficulty={quiz.difficulty}
                />
              ))}
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-blue-800">Complete all interactive examples</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-blue-800">Take the chapter quiz</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-blue-800">Move to the next chapter</span>
                </div>
              </div>
              
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Continue Learning →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}