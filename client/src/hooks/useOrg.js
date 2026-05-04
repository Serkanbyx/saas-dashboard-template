import { useContext } from 'react';
import { OrgContext } from '../context/OrgContext';

export const useOrg = () => useContext(OrgContext);
