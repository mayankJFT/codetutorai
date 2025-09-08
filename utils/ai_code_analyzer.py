"""
AI-Powered Code Analysis Module
Provides intelligent code analysis, explanations, and insights
"""

import os
import json
import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from utils.call_llm import call_llm

@dataclass
class CodeInsight:
    """Represents an AI-generated code insight"""
    type: str  # 'explanation', 'pattern', 'suggestion', 'complexity'
    title: str
    description: str
    code_snippet: str
    confidence: float
    line_numbers: List[int]

@dataclass
class ArchitectureComponent:
    """Represents a system architecture component"""
    name: str
    type: str  # 'class', 'function', 'module', 'service'
    purpose: str
    dependencies: List[str]
    complexity_score: float

class AICodeAnalyzer:
    """Advanced AI-powered code analysis"""
    
    def __init__(self):
        self.analysis_cache = {}
        
    def analyze_code_structure(self, file_content: str, file_path: str, language: str = "python") -> Dict[str, Any]:
        """Analyze code structure and generate insights"""
        cache_key = f"{file_path}_{hash(file_content)}"
        
        if cache_key in self.analysis_cache:
            print(f"Using cached analysis for {file_path}")
            return self.analysis_cache[cache_key]
        
        print(f"Analyzing code structure for {file_path}")
        
        prompt = f"""
Analyze this {language} code and provide comprehensive insights:

File: {file_path}
Code:
```{language}
{file_content[:2000]}...
```

Provide analysis in JSON format with:
1. **complexity_analysis**: Overall complexity score (1-10) and explanation
2. **key_functions**: List of important functions/methods with descriptions
3. **design_patterns**: Detected design patterns and their purposes
4. **code_smells**: Potential issues or improvements
5. **architecture_role**: How this component fits in the overall system
6. **learning_insights**: Key concepts beginners should understand

Return valid JSON only:
"""
        
        try:
            response = call_llm(prompt, use_cache=True)
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                analysis = json.loads(json_match.group())
                
                # Add metadata
                analysis['file_path'] = file_path
                analysis['language'] = language
                analysis['analyzed_at'] = str(os.path.getmtime(file_path) if os.path.exists(file_path) else "")
                
                self.analysis_cache[cache_key] = analysis
                return analysis
            else:
                print(f"Could not extract JSON from AI response for {file_path}")
                return self._generate_fallback_analysis(file_content, file_path, language)
                
        except Exception as e:
            print(f"AI analysis failed for {file_path}: {e}")
            return self._generate_fallback_analysis(file_content, file_path, language)
    
    def generate_code_explanations(self, code_snippet: str, context: str = "") -> List[CodeInsight]:
        """Generate line-by-line code explanations"""
        print(f"Generating code explanations for snippet: {code_snippet[:50]}...")
        
        prompt = f"""
Provide detailed, beginner-friendly explanations for this code:

Context: {context}
Code:
```
{code_snippet}
```

For each important line or block, explain:
- What it does in simple terms
- Why it's important
- How it fits in the bigger picture
- Any best practices or patterns used

Return as JSON array of explanations with format:
[
  {{
    "line_numbers": [1, 2],
    "code": "actual code",
    "explanation": "beginner-friendly explanation",
    "concept": "programming concept demonstrated",
    "importance": "why this matters"
  }}
]
"""
        
        try:
            response = call_llm(prompt, use_cache=True)
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            
            if json_match:
                explanations = json.loads(json_match.group())
                insights = []
                
                for exp in explanations:
                    insight = CodeInsight(
                        type='explanation',
                        title=exp.get('concept', 'Code Explanation'),
                        description=exp.get('explanation', ''),
                        code_snippet=exp.get('code', ''),
                        confidence=0.8,
                        line_numbers=exp.get('line_numbers', [])
                    )
                    insights.append(insight)
                
                return insights
            
        except Exception as e:
            print(f"Failed to generate code explanations: {e}")
            
        # Fallback: simple analysis
        return [CodeInsight(
            type='explanation',
            title='Code Analysis',
            description='This code performs the main functionality of the component.',
            code_snippet=code_snippet[:200] + "...",
            confidence=0.6,
            line_numbers=[1]
        )]
    
    def detect_architecture_patterns(self, files_data: List[tuple]) -> List[ArchitectureComponent]:
        """Detect system architecture patterns and components"""
        print("Detecting architecture patterns across codebase...")
        
        # Prepare file summaries for analysis
        file_summaries = []
        for path, content in files_data[:20]:  # Limit to first 20 files
            summary = {
                'path': path,
                'size': len(content),
                'preview': content[:300] + "..." if len(content) > 300 else content
            }
            file_summaries.append(summary)
        
        prompt = f"""
Analyze this codebase structure and identify the main architecture components:

Files analyzed: {len(file_summaries)}
File structure:
{json.dumps(file_summaries, indent=2)[:1500]}...

Identify the main architectural components and their relationships:
1. Core business logic components
2. Data access layers
3. API/interface components
4. Utility/helper modules
5. Configuration/setup files

For each component, provide:
- name: Component name
- type: 'service', 'controller', 'model', 'utility', 'config'
- purpose: What it does in 1-2 sentences
- dependencies: List of other components it depends on
- complexity_score: 1-10 based on size and complexity

Return as JSON array:
"""
        
        try:
            response = call_llm(prompt, use_cache=True)
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            
            if json_match:
                components_data = json.loads(json_match.group())
                components = []
                
                for comp in components_data:
                    component = ArchitectureComponent(
                        name=comp.get('name', 'Unknown Component'),
                        type=comp.get('type', 'unknown'),
                        purpose=comp.get('purpose', ''),
                        dependencies=comp.get('dependencies', []),
                        complexity_score=float(comp.get('complexity_score', 5.0))
                    )
                    components.append(component)
                
                return components
                
        except Exception as e:
            print(f"Architecture analysis failed: {e}")
        
        return []
    
    def generate_learning_path(self, abstractions: List[Dict], relationships: Dict) -> Dict[str, Any]:
        """Generate an optimal learning path based on code complexity"""
        print("Generating AI-optimized learning path...")
        
        prompt = f"""
Based on these code abstractions and their relationships, create an optimal learning path:

Abstractions:
{json.dumps(abstractions, indent=2)[:1000]}...

Relationships:
{json.dumps(relationships, indent=2)[:500]}...

Create a learning path that:
1. Starts with fundamental concepts
2. Builds complexity gradually
3. Explains dependencies before dependent components
4. Includes practical examples and exercises
5. Provides difficulty indicators

Return JSON with:
{{
  "learning_path": [
    {{
      "step": 1,
      "title": "Step title",
      "abstraction": "abstraction_name",
      "difficulty": "beginner|intermediate|advanced",
      "prerequisites": ["list of previous steps"],
      "learning_objectives": ["what learner will understand"],
      "estimated_time": "time in minutes",
      "key_concepts": ["main concepts to grasp"]
    }}
  ],
  "total_estimated_time": "total time",
  "difficulty_progression": "how difficulty increases"
}}
"""
        
        try:
            response = call_llm(prompt, use_cache=True)
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            
            if json_match:
                return json.loads(json_match.group())
                
        except Exception as e:
            print(f"Learning path generation failed: {e}")
        
        # Fallback: simple linear path
        return {
            "learning_path": [
                {
                    "step": i + 1,
                    "title": abs_item.get('name', f'Step {i+1}'),
                    "abstraction": abs_item.get('name', ''),
                    "difficulty": "intermediate",
                    "prerequisites": [f"Step {i}"] if i > 0 else [],
                    "learning_objectives": [f"Understand {abs_item.get('name', 'concept')}"],
                    "estimated_time": "15-20 minutes",
                    "key_concepts": ["Core functionality"]
                }
                for i, abs_item in enumerate(abstractions[:5])
            ],
            "total_estimated_time": f"{len(abstractions) * 20} minutes",
            "difficulty_progression": "Linear progression from basic to advanced"
        }
    
    def suggest_improvements(self, code_content: str, file_path: str) -> List[Dict[str, Any]]:
        """Suggest code improvements and best practices"""
        print(f"Analyzing code for improvements: {file_path}")
        
        prompt = f"""
Analyze this code and suggest improvements for better readability, performance, and maintainability:

File: {file_path}
Code:
```
{code_content[:1500]}...
```

Provide suggestions in JSON format:
[
  {{
    "type": "performance|readability|security|maintainability",
    "title": "Brief improvement title",
    "description": "Detailed explanation of the issue and solution",
    "code_location": "where in the code this applies",
    "priority": "high|medium|low",
    "example": "example of improved code if applicable"
  }}
]
"""
        
        try:
            response = call_llm(prompt, use_cache=True)
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            
            if json_match:
                return json.loads(json_match.group())
                
        except Exception as e:
            print(f"Code improvement analysis failed: {e}")
        
        return []
    
    def _generate_fallback_analysis(self, file_content: str, file_path: str, language: str) -> Dict[str, Any]:
        """Generate basic analysis when AI fails"""
        lines = file_content.split('\n')
        functions = [line.strip() for line in lines if 'def ' in line or 'function ' in line]
        
        return {
            'file_path': file_path,
            'language': language,
            'complexity_analysis': {
                'score': min(len(lines) // 10, 10),
                'explanation': f'File has {len(lines)} lines with {len(functions)} functions'
            },
            'key_functions': functions[:5],
            'design_patterns': ['Standard structure'],
            'code_smells': [],
            'architecture_role': 'Component in the system',
            'learning_insights': [f'Understanding {language} file structure']
        }

# Global instance
ai_analyzer = AICodeAnalyzer()