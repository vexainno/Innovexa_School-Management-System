export interface LearningResource {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  classId: string;
  className: string;
  section: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  uploadedAt: string;
  file: Blob;
}

const DB_NAME = 'innosysedu-learning-resources';
const STORE_NAME = 'resources';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Your browser does not support local file storage.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });

        store.createIndex('classId', 'classId', { unique: false });
        store.createIndex('subjectId', 'subjectId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open resource storage.'));
  });
}

export async function saveLearningResource(
  resource: LearningResource
): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');

    transaction.objectStore(STORE_NAME).put(resource);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Could not save resource.'));
    };

    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('Resource saving was cancelled.'));
    };
  });
}

export async function getLearningResources(): Promise<LearningResource[]> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => {
      database.close();

      const resources = request.result as LearningResource[];

      resolve(
        resources.sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() -
            new Date(a.uploadedAt).getTime()
        )
      );
    };

    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error('Could not load resources.'));
    };
  });
}

export async function deleteLearningResource(id: string): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');

    transaction.objectStore(STORE_NAME).delete(id);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Could not delete resource.'));
    };
  });
}