import axios from 'axios';
import { GymFitExercise } from './types/exerciseAPI';
import { RAPID_API_KEY } from '@env';

console.log('API Key:', RAPID_API_KEY);

// Get this from RapidAPI
const RAPIDAPI_HOST = 'gym-fit.p.rapidapi.com';

const apiClient = axios.create({
  baseURL: 'https://gym-fit.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
  },
  timeout: 10000,
});

export const GymFitAPI = {
  // Get all exercises
  getAllExercises: async (): Promise<GymFitExercise[]> => {
    try {
      console.log('Fetching from: https://gym-fit.p.rapidapi.com/exercises');
      const response = await apiClient.get('/exercises');
      console.log('Success! Got', response.data.length, 'exercises');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching exercises:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      return [];
    }
  },

  // Get exercise by ID
  getExerciseById: async (id: string): Promise<GymFitExercise | null> => {
    try {
      const response = await apiClient.get(`/exercises/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exercise by ID:', error);
      return null;
    }
  },

  // Get exercises by body part
  getExercisesByBodyPart: async (bodyPart: string): Promise<GymFitExercise[]> => {
    try {
      const response = await apiClient.get(`/bodyParts/${bodyPart}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exercises by body part:', error);
      return [];
    }
  },

  // Search exercises by name
  searchExercises: async (query: string): Promise<GymFitExercise[]> => {
    try {
      const allExercises = await apiClient.get('/exercises');
      return allExercises.data.filter((ex: GymFitExercise) =>
        ex.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching exercises:', error);
      return [];
    }
  },

  // Get all body parts
  getAllBodyParts: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get('/bodyParts');
      return response.data;
    } catch (error) {
      console.error('Error fetching body parts:', error);
      return [];
    }
  },

  // Get all equipment types
  getAllEquipments: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get('/equipments');
      return response.data;
    } catch (error) {
      console.error('Error fetching equipments:', error);
      return [];
    }
  },
};