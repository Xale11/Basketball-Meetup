import { Court, CreateCourtForm } from '@/types/courts';
import { db, storage } from './firebase';
import { addDoc, collection, updateDoc, doc, setDoc } from 'firebase/firestore';
import { uploadImagesToStorage } from './utils.api';
import * as Crypto from 'expo-crypto';


export const createCourt = async (court: CreateCourtForm): Promise<Court> => {
  // I need to create my own court id first so that I can create a like between the court 
  // images and the actuall court itself. The image files are stored stored seperate to the
  // json data
  const courtId = Crypto.randomUUID()
  try {
    
    // STEP 1: Upload images to storage and fetch the firebase download urls
    const imageUrls: string[] =
      await uploadImagesToStorage(court.images, 'courts', courtId);

    // STEP 2: Create and upload court document to firebase
    const courtData: Omit<Court, 'id'> = {
      name: court.name,
      description: court.description,
      location: {
        address: court.address,
        latitude: court.latitude,
        longitude: court.longitude,
        geohash: court.geohash,
      },
      tags: court.tags,
      createdBy: court.createdBy,
      openingHours: court.openingHours,
      images: imageUrls, // sets the firebase donwload urls
      checkedInUsers: [],
      followers: [],
      createdAt: new Date().toISOString(),
      verified: false,
    };

    await setDoc(doc(db, 'courts', courtId), courtData)

    return {id: courtId, ...courtData}
  } catch (error) {
    throw new Error(`Failed to create a court, ${JSON.stringify(error)}`);
  }
};

// fetch all - with paginaton, filtering and sort

// fetch by id

// fetch by search

// update by id

// delete by id
