import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { TrashIcon } from '@heroicons/react/24/outline';
import History from './History';

const SavedTranscriptions = () => {
  return <History />;
};

export default SavedTranscriptions; 