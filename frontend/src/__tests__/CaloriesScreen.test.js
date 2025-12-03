import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaloriesScreen from '../screens/CaloriesScreen';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockFoodResults = {
  results: [
    {
      id: '1',
      name: 'apple',
      servingSize: '182g',
      calories: 95,
      macros: { protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19 }
    },
    {
      id: '2',
      name: 'banana',
      servingSize: '118g',
      calories: 105,
      macros: { protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14 }
    }
  ],
  isMock: true
};

beforeEach(() => {
  mockFetch.mockClear();
  localStorage.clear();
});

describe('CaloriesScreen', () => {
  describe('Rendering', () => {
    it('renders the calorie tracker title', () => {
      render(<CaloriesScreen />);
      expect(screen.getByText('Calorie Tracker')).toBeInTheDocument();
    });

    it('renders the search input and button', () => {
      render(<CaloriesScreen />);
      expect(screen.getByPlaceholderText(/search for a food/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('renders daily progress section', () => {
      render(<CaloriesScreen />);
      expect(screen.getByText("Today's Progress")).toBeInTheDocument();
    });

    it('renders macro summary labels', () => {
      render(<CaloriesScreen />);
      expect(screen.getByText('Protein')).toBeInTheDocument();
      expect(screen.getByText('Carbs')).toBeInTheDocument();
      expect(screen.getByText('Fat')).toBeInTheDocument();
    });

    it('renders goal section', () => {
      render(<CaloriesScreen />);
      expect(screen.getByText('Daily Goal')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set goal/i })).toBeInTheDocument();
    });

    it('shows empty state message when no foods added', () => {
      render(<CaloriesScreen />);
      expect(screen.getByText(/no foods added yet/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls API when search button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFoodResults
      });

      render(<CaloriesScreen />);
      
      const searchInput = screen.getByPlaceholderText(/search for a food/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await userEvent.type(searchInput, 'apple');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/calories/search?q=apple')
        );
      });
    });

    it('displays search results after successful search', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFoodResults
      });

      render(<CaloriesScreen />);
      
      const searchInput = screen.getByPlaceholderText(/search for a food/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await userEvent.type(searchInput, 'apple');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument();
        expect(screen.getByText('95 kcal')).toBeInTheDocument();
      });
    });

    it('shows loading state during search', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<CaloriesScreen />);
      
      const searchInput = screen.getByPlaceholderText(/search for a food/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await userEvent.type(searchInput, 'apple');
      fireEvent.click(searchButton);

      expect(screen.getByText(/searching/i)).toBeInTheDocument();
    });

    it('handles search on Enter key press', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFoodResults
      });

      render(<CaloriesScreen />);
      
      const searchInput = screen.getByPlaceholderText(/search for a food/i);
      await userEvent.type(searchInput, 'apple{enter}');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('does not search if query is empty', async () => {
      render(<CaloriesScreen />);
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Adding Foods', () => {
    it('adds food to today list when Add button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFoodResults
      });

      render(<CaloriesScreen />);
      
      const searchInput = screen.getByPlaceholderText(/search for a food/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await userEvent.type(searchInput, 'apple');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add/i });
      fireEvent.click(addButtons[0]);

      const todaySection = screen.getByText("Today's Foods").parentElement;
      expect(todaySection).toHaveTextContent('apple');
    });

    it('updates calorie total when food is added', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFoodResults
      });

      render(<CaloriesScreen />);
      
      const searchInput = screen.getByPlaceholderText(/search for a food/i);
      await userEvent.type(searchInput, 'apple');
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole('button', { name: /add/i })[0]);

      await waitFor(() => {
        expect(screen.getByText('95')).toBeInTheDocument();
      });
    });
  });

  describe('Removing Foods', () => {
    it('removes food from today list when remove button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFoodResults
      });

      render(<CaloriesScreen />);
      
      const searchInput = screen.getByPlaceholderText(/search for a food/i);
      await userEvent.type(searchInput, 'apple');
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole('button', { name: /add/i })[0]);

      const removeButton = screen.getByRole('button', { name: /✕/i });
      fireEvent.click(removeButton);

      expect(screen.getByText(/no foods added yet/i)).toBeInTheDocument();
    });
  });

  describe('Daily Goal', () => {
    it('allows setting a new daily goal', async () => {
      render(<CaloriesScreen />);
      
      const goalInput = screen.getByDisplayValue('2000');
      await userEvent.clear(goalInput);
      await userEvent.type(goalInput, '2500');
      
      fireEvent.click(screen.getByRole('button', { name: /set goal/i }));

      expect(screen.getByText(/2500/)).toBeInTheDocument();
    });

    it('validates goal is within acceptable range', async () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<CaloriesScreen />);
      
      const goalInput = screen.getByDisplayValue('2000');
      await userEvent.clear(goalInput);
      await userEvent.type(goalInput, '500');
      
      fireEvent.click(screen.getByRole('button', { name: /set goal/i }));

      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('between 1000 and 5000')
      );
      
      alertMock.mockRestore();
    });
  });

  describe('LocalStorage Persistence', () => {
    it('saves foods to localStorage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFoodResults
      });

      render(<CaloriesScreen />);
      
      const searchInput = screen.getByPlaceholderText(/search for a food/i);
      await userEvent.type(searchInput, 'apple');
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByRole('button', { name: /add/i })[0]);

      const savedFoods = JSON.parse(localStorage.getItem('todaysFoods'));
      expect(savedFoods).toHaveLength(1);
      expect(savedFoods[0].name).toBe('apple');
    });

    it('saves daily goal to localStorage', async () => {
      render(<CaloriesScreen />);
      
      const goalInput = screen.getByDisplayValue('2000');
      await userEvent.clear(goalInput);
      await userEvent.type(goalInput, '2500');
      
      fireEvent.click(screen.getByRole('button', { name: /set goal/i }));

      expect(localStorage.getItem('dailyGoal')).toBe('2500');
    });
  });
});
