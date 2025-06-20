
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit3, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state for creating new todos
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: '',
    completed: false
  });

  // Form state for editing existing todos
  const [editData, setEditData] = useState<{
    title: string;
    description: string;
  }>({
    title: '',
    description: ''
  });

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const newTodo = await trpc.createTodo.mutate(formData);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setFormData({
        title: '',
        description: '',
        completed: false
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const updatedTodo = await trpc.toggleTodo.mutate({ id });
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => 
          todo.id === id ? updatedTodo : todo
        )
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditData({
      title: todo.title,
      description: todo.description
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ title: '', description: '' });
  };

  const handleEditSubmit = async (id: number) => {
    if (!editData.title.trim()) return;
    
    try {
      const updateInput: UpdateTodoInput = {
        id,
        title: editData.title,
        description: editData.description
      };
      const updatedTodo = await trpc.updateTodo.mutate(updateInput);
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => 
          todo.id === id ? updatedTodo : todo
        )
      );
      setEditingId(null);
      setEditData({ title: '', description: '' });
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">✓ Todo</h1>
          <p className="text-gray-400">Stay organized, stay productive</p>
          <div className="mt-4 flex justify-center gap-4">
            <Badge variant="outline" className="bg-gray-800 border-gray-700">
              {completedCount} completed
            </Badge>
            <Badge variant="outline" className="bg-gray-800 border-gray-700">
              {totalCount - completedCount} remaining
            </Badge>
          </div>
        </div>

        {/* Create Todo Form */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Todo
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <Input
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
              <Textarea
                placeholder="Add a description (optional)"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, description: e.target.value }))
                }
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none"
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !formData.title.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Adding...' : 'Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-12 text-center">
                <Circle className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No todos yet</p>
                <p className="text-gray-500 text-sm">Create your first todo above to get started</p>
              </CardContent>
            </Card>
          ) : (
            todos.map((todo: Todo) => (
              <Card key={todo.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                <CardContent className="p-4">
                  {editingId === todo.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <Input
                        value={editData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditData((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Textarea
                        value={editData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setEditData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className="bg-gray-700 border-gray-600 text-white resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditSubmit(todo.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggle(todo.id)}
                        className="mt-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium mb-1 ${
                          todo.completed 
                            ? 'text-gray-500 line-through' 
                            : 'text-white'
                        }`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className={`text-sm mb-2 ${
                            todo.completed 
                              ? 'text-gray-600 line-through' 
                              : 'text-gray-400'
                          }`}>
                            {todo.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Created {todo.created_at.toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          onClick={() => startEdit(todo)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(todo.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        {todos.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="text-center text-sm text-gray-500">
              {completedCount === totalCount 
                ? "🎉 All tasks completed! Great job!" 
                : `${totalCount - completedCount} task${totalCount - completedCount !== 1 ? 's' : ''} remaining`
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
