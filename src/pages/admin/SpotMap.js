import React from 'react';
import AttendantSpotMap from '../attendant/SpotMap';

// Reuses the attendant spot map component as-is.
// Admin gets the same read-only visual — it's a gimmick overview,
// full spot management lives in the Lots page.
export default function AdminSpotMap() {
  return <AttendantSpotMap />;
}