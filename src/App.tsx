/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType,
  Timestamp 
} from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  deleteDoc,
  updateDoc, 
  collection, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  User as UserIcon, 
  Mail, 
  Hash, 
  Calendar, 
  BookOpen, 
  Shield, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Unlock,
  Users,
  Search,
  School,
  Clock,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Types ---

interface Admin {
  id?: string;
  email: string;
  fullName: string;
  addedAt?: any;
  addedBy?: string;
}

interface StudentData {
  fullName: string;
  indexNumber: string;
  age: number;
  gender: string;
  email: string;
  year: number;
  semester: number;
  department: string;
  photo?: string;
  registeredCourses?: string[];
  uid: string;
  createdAt?: any;
}

interface SystemSettings {
  registrationOpen: boolean;
  registrationStart?: any;
  registrationEnd?: any;
}

interface Course {
  id?: string;
  name: string;
  level: number;
  semester: number;
  type: 'Core' | 'Elective';
  department?: string;
}

const DEPARTMENTS_LIST = [
  'Sciences', 'ICT', 
  'Technical', 'Home Economics', 'Agriculture', 
  'Early Childhood', 'Primary Education'
];

const L100_GENERAL_COURSES = [
  "Foundations of Education in Ghana",
  "Inclusive School-Based Inquiry",
  "Language and Literacy",
  "Mathematics",
  "Science",
  "Social Studies and TVET",
  "Supported Teaching In School (STS)",
  "Africa Studies"
];

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' }) => {
  const variants = {
    primary: 'bg-college-red text-white hover:bg-red-700 shadow-md',
    secondary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md',
    outline: 'border-2 border-college-red text-college-red hover:bg-red-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md'
  };

  return (
    <button 
      className={cn(
        'px-6 py-2.5 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
      {Icon && <Icon size={16} className="text-college-red" />}
      {label}
    </label>
    <input 
      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-college-red focus:border-transparent transition-all outline-none"
      {...props}
    />
  </div>
);

const Select = ({ label, icon: Icon, options, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
      {Icon && <Icon size={16} className="text-college-red" />}
      {label}
    </label>
    <select 
      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-college-red focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
      {...props}
    >
      <option value="">Select {label}</option>
      {options.map((opt: any) => (
        <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
      ))}
    </select>
  </div>
);

const PhotoUpload = ({ value, onChange }: { value?: string, onChange: (base64: string) => void }) => {
  const [preview, setPreview] = useState(value);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw image to fit 200x150
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          setPreview(base64);
          onChange(base64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <UserIcon size={16} className="text-college-red" />
        Passport Photo (200x150)
      </label>
      <div className="flex items-center gap-6">
        <div className="w-[200px] h-[150px] bg-white border-2 border-dashed border-slate-300 rounded-lg overflow-hidden flex items-center justify-center relative group shadow-inner">
          {preview ? (
            <img src={preview} alt="Passport Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="text-center p-4">
              <UserIcon size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-[10px] text-slate-400 font-bold uppercase">No Photo</p>
            </div>
          )}
          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <span className="text-white text-xs font-bold">Change Photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-xs text-slate-500">
            Please upload a clear passport-sized photo. It will be automatically resized to 200x150 pixels.
          </p>
          <Button variant="outline" className="py-1.5 px-4 text-xs" onClick={() => document.getElementById('photo-input')?.click()}>
            Upload Photo
          </Button>
          <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({ registrationOpen: false });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allAdmins, setAllAdmins] = useState<Admin[]>([]);
  const [newAdmin, setNewAdmin] = useState<Admin>({ email: '', fullName: '' });
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<StudentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedSemester, setSelectedSemester] = useState<number>(0);
  const [schedStart, setSchedStart] = useState('');
  const [schedEnd, setSchedEnd] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedElectives, setSelectedElectives] = useState<string[]>([]);
  const [newCourse, setNewCourse] = useState<Course>({ name: '', level: 100, semester: 1, type: 'Core' });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>(DEPARTMENTS_LIST);
  const [newDept, setNewDept] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const adminDoc = await getDoc(doc(db, 'admins', u.uid));
        const isOwner = u.email === "reagandanlugu09@gmail.com";
        
        if (isOwner && !adminDoc.exists()) {
          try {
            await setDoc(doc(db, 'admins', u.uid), {
              email: u.email,
              fullName: u.displayName || "Primary Owner",
              addedAt: serverTimestamp(),
              addedBy: "system"
            });
          } catch (e) {
            console.error("Auto-promotion failed", e);
          }
        }
        
        setIsAdmin(adminDoc.exists() || isOwner);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubAdmins = onSnapshot(
      collection(db, 'admins'), 
      (snapshot) => {
        setAllAdmins(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'admins')
    );
    return unsubAdmins;
  }, [isAdmin]);

  useEffect(() => {
    if (!user) {
      setStudentData(null);
      return;
    }

    const unsubStudent = onSnapshot(
      doc(db, 'students', user.uid), 
      (snapshot) => {
        if (snapshot.exists()) {
          setStudentData(snapshot.data() as StudentData);
        } else {
          setStudentData(null);
        }
      }, 
      (err) => handleFirestoreError(err, OperationType.GET, `students/${user.uid}`)
    );

    return unsubStudent;
  }, [user]);

  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'registration'), 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SystemSettings;
          setSettings(data);
          if (data.registrationStart) {
            const date = data.registrationStart.toDate();
            setSchedStart(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
          }
          if (data.registrationEnd) {
            const date = data.registrationEnd.toDate();
            setSchedEnd(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
          }
        } else {
          // Initialize settings if not exists
          if (isAdmin) {
            setDoc(doc(db, 'settings', 'registration'), { registrationOpen: false }).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, 'settings/registration');
            });
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'settings/registration')
    );
    return unsubSettings;
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
    const unsubAll = onSnapshot(
      q, 
      (snapshot) => {
        const students = snapshot.docs.map(d => d.data() as StudentData);
        setAllStudents(students);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'students')
    );
    return unsubAll;
  }, [isAdmin]);

  useEffect(() => {
    if (!user) {
      setCourses([]);
      setDepartments(DEPARTMENTS_LIST);
      return;
    }

    const q = query(collection(db, 'courses'), orderBy('level'), orderBy('semester'));
    const unsubCourses = onSnapshot(
      q, 
      (snapshot) => {
        const courseList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        setCourses(courseList);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'courses')
    );

    const unsubDepts = onSnapshot(
      collection(db, 'programmes'), 
      (snapshot) => {
        const dbProgs = snapshot.docs.map(d => d.data().name as string);
        // Logic: Merge hardcoded ones with DB ones, then filter out 'vi.' if requested
        const merged = [...new Set([...DEPARTMENTS_LIST, ...dbProgs])]
          .filter(name => name.toLowerCase() !== 'vi.' && name.toLowerCase() !== 'vi');
        setDepartments(merged);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'programmes')
    );

    return () => {
      unsubCourses();
      unsubDepts();
    };
  }, [user]);

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("You do not have administrator permissions to manage courses.");
      return;
    }
    if (!newCourse.name) {
      alert("Course name is required.");
      return;
    }
    try {
      if (editingCourseId) {
        await updateDoc(doc(db, 'courses', editingCourseId), {
          ...newCourse
        });
        setEditingCourseId(null);
      } else {
        await addDoc(collection(db, 'courses'), newCourse);
      }
      setNewCourse({ name: '', level: 100, semester: 1, type: 'Core' });
    } catch (error) {
      alert("Failed to save course. Please check your permissions.");
      handleFirestoreError(error, OperationType.WRITE, 'courses');
    }
  };

  const startEditCourse = (course: Course) => {
    setEditingCourseId(course.id!);
    setNewCourse({
      name: course.name,
      level: course.level,
      semester: course.semester,
      type: course.type,
      department: course.department
    });
  };

  const removeCourse = async (id: string) => {
    if (!isAdmin || !id) {
      alert("You do not have administrator permissions to manage courses.");
      return;
    }
    if (!confirm('Are you sure you want to remove this course?')) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
    } catch (error) {
      alert("Failed to delete course. Please check your permissions.");
      handleFirestoreError(error, OperationType.DELETE, `courses/${id}`);
    }
  };

  const saveProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("You do not have administrator permissions to manage programmes.");
      return;
    }
    if (!newDept) {
      alert("Programme name is required.");
      return;
    }
    try {
      // Check if already exists in the collection to avoid duplicates
      await addDoc(collection(db, 'programmes'), { 
        name: newDept, 
        createdAt: serverTimestamp(),
        addedBy: user?.email || 'unknown'
      });
      setNewDept('');
    } catch (error) {
      alert("Failed to add programme. Please check your permissions.");
      handleFirestoreError(error, OperationType.WRITE, 'programmes');
    }
  };

  const removeProgramme = async (name: string) => {
    if (!isAdmin) {
      alert("You do not have administrator permissions to manage programmes.");
      return;
    }
    if (!confirm(`Are you sure you want to remove the programme: ${name}?`)) return;
    try {
      const q = query(collection(db, 'programmes'), where('name', '==', name));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        // If not in DB, it might be a default one. 
        // We filter it out locally and it won't come back from onSnapshot if we start adding others.
        setDepartments(prev => prev.filter(d => d !== name));
      } else {
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, 'programmes', d.id)));
        await Promise.all(deletePromises);
      }
    } catch (error) {
      alert("Failed to remove programme. Please check your permissions.");
      handleFirestoreError(error, OperationType.DELETE, 'programmes');
    }
  };

  const saveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newAdmin.email) return;
    try {
      if (editingAdminId) {
        await updateDoc(doc(db, 'admins', editingAdminId), {
          fullName: newAdmin.fullName,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid
        });
        setEditingAdminId(null);
        alert(`Admin details updated for ${newAdmin.email}`);
      } else {
        // We need to find the user's UID by email to promote them properly
        const q = query(collection(db, 'students'), where('email', '==', newAdmin.email));
        const snap = await getDocs(q);
        if (snap.empty) {
          alert("User not found in records. The user must have a student/staff profile (logged in at least once) to be promoted.");
          return;
        }
        const userId = snap.docs[0].id;
        const userData = snap.docs[0].data();
        await setDoc(doc(db, 'admins', userId), {
          email: newAdmin.email,
          fullName: newAdmin.fullName || userData.fullName,
          addedAt: serverTimestamp(),
          addedBy: user?.uid
        });
        alert(`${newAdmin.fullName || userData.fullName} promoted to Administrator!`);
      }
      setNewAdmin({ email: '', fullName: '' });
    } catch (error) {
      alert("Failed to save administrator details. Please check your permissions.");
      handleFirestoreError(error, OperationType.WRITE, 'admins');
    }
  };

  const removeAdmin = async (id: string, email: string) => {
    if (!isAdmin) {
      alert("You do not have administrator permissions to manage administrators.");
      return;
    }
    if (email === "reagandanlugu09@gmail.com") {
      alert("Cannot remove the primary system owner.");
      return;
    }
    if (!confirm(`Are you sure you want to remove ${email} from administrators?`)) return;
    try {
      await deleteDoc(doc(db, 'admins', id));
    } catch (error) {
      alert("Failed to remove administrator. Please check your permissions.");
      handleFirestoreError(error, OperationType.DELETE, `admins/${id}`);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const toggleRegistration = async () => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'settings', 'registration'), {
        registrationOpen: !settings.registrationOpen,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/registration');
    }
  };

  const updateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'settings', 'registration'), {
        registrationStart: schedStart ? Timestamp.fromDate(new Date(schedStart)) : null,
        registrationEnd: schedEnd ? Timestamp.fromDate(new Date(schedEnd)) : null,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      });
      alert('Registration schedule updated!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/registration');
    }
  };

  const isCurrentlyOpen = () => {
    if (!settings.registrationOpen) return false;
    const now = new Date();
    if (settings.registrationStart) {
      const start = settings.registrationStart.toDate();
      if (now < start) return false;
    }
    if (settings.registrationEnd) {
      const end = settings.registrationEnd.toDate();
      if (now > end) return false;
    }
    return true;
  };

  const getRegistrationStatusMessage = () => {
    if (!settings.registrationOpen) return "Registration is manually closed by administrator.";
    const now = new Date();
    if (settings.registrationStart && now < settings.registrationStart.toDate()) {
      return `Registration is scheduled to open on ${settings.registrationStart.toDate().toLocaleString()}.`;
    }
    if (settings.registrationEnd && now > settings.registrationEnd.toDate()) {
      return `Registration closed on ${settings.registrationEnd.toDate().toLocaleString()}.`;
    }
    if (settings.registrationEnd) {
      return `Registration is open until ${settings.registrationEnd.toDate().toLocaleString()}.`;
    }
    return "Registration is currently open.";
  };

  const submitRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    const formData = new FormData(e.currentTarget);
    const year = Number(formData.get('year'));
    const semester = Number(formData.get('semester'));
    
    // Get all core courses for this level/semester
    const levelCourses = courses.filter(c => c.level === year * 100 && c.semester === semester);
    const coreCourses = levelCourses.filter(c => c.type === 'Core').map(c => c.name);
    
    // Combine with selected electives
    const allRegisteredCourses = [...coreCourses, ...selectedElectives];

    // Fallback for Level 100 if no courses added to DB yet
    const finalCourses = (year === 1 && semester === 1 && allRegisteredCourses.length === 0) 
      ? L100_GENERAL_COURSES 
      : allRegisteredCourses;
    
    const data: StudentData = {
      fullName: formData.get('fullName') as string,
      indexNumber: formData.get('indexNumber') as string,
      age: Number(formData.get('age')),
      gender: formData.get('gender') as string,
      email: user.email || '',
      year: year,
      semester: semester,
      department: formData.get('department') as string,
      photo: photoBase64,
      registeredCourses: finalCourses,
      uid: user.uid,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'students', user.uid), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `students/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header id="main-header" className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div id="header-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div id="brand-container" className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-100">
              <img src="/logo.png" alt="SJB Logo" className="w-12 h-12 object-contain" onError={(e) => {
                e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=SJB&backgroundColor=E31E24';
              }} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">St. John Bosco</h1>
              <p className="text-[10px] font-bold text-college-red uppercase tracking-[0.2em]">College of Education</p>
            </div>
          </div>

          <div id="auth-controls" className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-slate-900">{user.displayName}</p>
                  <p className="text-xs text-slate-500">{isAdmin ? 'Administrator' : 'Student'}</p>
                </div>
                <Button id="logout-button" variant="outline" onClick={handleLogout} className="px-3 py-2">
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Button id="login-header-button" onClick={handleLogin}>
                <UserIcon size={18} />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              id="landing-page"
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto text-center space-y-8 py-12"
            >
              <div className="space-y-4">
                <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                  Student Registration <br />
                  <span className="text-college-red">Portal</span>
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
                  Welcome to the official registration portal for St. John Bosco College of Education. 
                  Please sign in to begin your registration process.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 text-left space-y-4 group hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-red-50 text-college-red rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GraduationCap size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">For Students</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Register for your courses, update your academic details, and track your registration status.</p>
                  <Button onClick={handleLogin} className="w-full py-4">Get Started</Button>
                </div>
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl text-left space-y-4 group hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-slate-800 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-white">For Administrators</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Manage registration periods, monitor student enrollments, and export registration data.</p>
                  <Button variant="outline" onClick={handleLogin} className="w-full py-4 border-slate-700 text-white hover:bg-slate-800">Admin Login</Button>
                </div>
              </div>
            </motion.div>
          ) : isAdmin ? (
            <motion.div 
              id="admin-dashboard"
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Admin Dashboard */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-700">Registration Status</h3>
                    {isCurrentlyOpen() ? (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                        <Unlock size={12} /> OPEN
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                        <Lock size={12} /> CLOSED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {getRegistrationStatusMessage()}
                  </p>
                  <Button 
                    variant={settings.registrationOpen ? 'danger' : 'secondary'} 
                    className="w-full"
                    onClick={toggleRegistration}
                  >
                    {settings.registrationOpen ? 'Disable Portal' : 'Enable Portal'}
                  </Button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Clock size={18} className="text-college-red" />
                    Schedule Registration
                  </h3>
                  <form onSubmit={updateSchedule} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date & Time</label>
                      <input 
                        type="datetime-local" 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-college-red"
                        value={schedStart}
                        onChange={(e) => setSchedStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">End Date & Time</label>
                      <input 
                        type="datetime-local" 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-college-red"
                        value={schedEnd}
                        onChange={(e) => setSchedEnd(e.target.value)}
                      />
                    </div>
                    <Button type="submit" variant="outline" className="w-full py-2 text-xs">
                      Update Schedule
                    </Button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-700">Total Registered</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-college-red">{allStudents.length}</span>
                    <span className="text-slate-400 font-medium pb-1">Students</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-college-red h-full w-2/3" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-700">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Portal link copied to clipboard!');
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors flex flex-col items-center gap-2"
                    >
                      <AlertCircle size={20} /> Share Link
                    </button>
                    <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors flex flex-col items-center gap-2">
                      <Users size={20} /> Export CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Course Management */}
              {isAdmin && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-college-red text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-100">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Course Management</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add or Remove Courses for all levels</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 grid lg:grid-cols-3 gap-8">
                      {/* Add Course Form */}
                      <div className={cn(
                        "space-y-6 p-6 rounded-2xl border transition-all duration-300",
                        editingCourseId ? "border-blue-200 bg-blue-50/50" : "border-slate-100 bg-white"
                      )}>
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            {editingCourseId ? (
                              <>
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
                                  <Pencil size={16} />
                                </div>
                                <span className="text-blue-700">Edit Existing Course</span>
                              </>
                            ) : (
                              <>
                                <div className="w-8 h-8 bg-college-red text-white rounded-lg flex items-center justify-center shadow-lg shadow-red-100">
                                  <Plus size={16} />
                                </div>
                                <span>Add New Course</span>
                              </>
                            )}
                          </h4>
                          <form onSubmit={saveCourse} className="space-y-4">
                            <Input 
                              label="Course Name" 
                              placeholder="e.g. Advanced Mathematics"
                              value={newCourse.name}
                              onChange={(e: any) => setNewCourse({ ...newCourse, name: e.target.value })}
                            />
                          <div className="grid grid-cols-2 gap-4">
                            <Select 
                              label="Level" 
                              options={[100, 200, 300, 400]}
                              value={newCourse.level}
                              onChange={(e: any) => setNewCourse({ ...newCourse, level: Number(e.target.value) })}
                            />
                            <Select 
                              label="Semester" 
                              options={[1, 2, 3, 4, 5, 6, 7, 8]}
                              value={newCourse.semester}
                              onChange={(e: any) => setNewCourse({ ...newCourse, semester: Number(e.target.value) })}
                            />
                          </div>
                          <Select 
                            label="Type" 
                            options={['Core', 'Elective']}
                            value={newCourse.type}
                            onChange={(e: any) => setNewCourse({ ...newCourse, type: e.target.value as any })}
                          />
                          <div className="flex gap-2">
                            <Button type="submit" className="flex-1">
                              {editingCourseId ? 'Update Course' : 'Add Course'}
                            </Button>
                            {editingCourseId && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                  setEditingCourseId(null);
                                  setNewCourse({ name: '', level: 100, semester: 1, type: 'Core' });
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </form>
                    </div>

                    {/* Course List */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">Current Courses</h4>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            type="text" 
                            placeholder="Search courses..." 
                            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-college-red w-48"
                            value={courseSearchQuery}
                            onChange={(e) => setCourseSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {courses.filter(c => c.name.toLowerCase().includes(courseSearchQuery.toLowerCase())).length === 0 ? (
                          <div className="col-span-2 py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium">No courses found matching "{courseSearchQuery}".</p>
                          </div>
                        ) : (
                          courses
                            .filter(c => c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()))
                            .map((course) => (
                            <div key={course.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-college-red transition-all">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900 leading-tight">{course.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">L{course.level}</span>
                                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">S{course.semester}</span>
                                  <span className={cn(
                                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                    course.type === 'Core' ? "bg-red-50 text-college-red" : "bg-emerald-50 text-emerald-600"
                                  )}>{course.type}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => startEditCourse(course)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Edit Course"
                                >
                                  <Pencil size={20} />
                                </button>
                                <button 
                                  onClick={() => removeCourse(course.id!)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Remove Course"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Administrator Management */}
              {isAdmin && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                        <Shield size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight">Administrator Management</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manage Portal Staff & Permissions</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 grid lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        {editingAdminId ? <Pencil size={18} className="text-slate-900" /> : <Plus size={18} className="text-slate-900" />}
                        {editingAdminId ? 'Edit Administrator' : 'Promote to Admin'}
                      </h4>
                      <form onSubmit={saveAdmin} className="space-y-4">
                        <Input 
                          label="Staff Email" 
                          placeholder="staff@example.com"
                          type="email"
                          value={newAdmin.email}
                          onChange={(e: any) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                          disabled={!!editingAdminId}
                        />
                        <Input 
                          label="Display Name" 
                          placeholder="Full Name"
                          value={newAdmin.fullName}
                          onChange={(e: any) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                        />
                        {!editingAdminId && <p className="text-[10px] text-slate-500 italic">User must have a registered student/staff profile first.</p>}
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
                            {editingAdminId ? 'Update Detail' : 'Add Administrator'}
                          </Button>
                          {editingAdminId && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setEditingAdminId(null);
                                setNewAdmin({ email: '', fullName: '' });
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </form>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                      <h4 className="font-bold text-slate-900">Current Portal Admins</h4>
                      <div className="grid sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Always show the owner if they are not in the collection yet (bootstrap phase) */}
                        {user?.email === "reagandanlugu09@gmail.com" && !allAdmins.find(a => a.email === user.email) && (
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-sm flex items-center justify-between text-white">
                            <div>
                              <span className="font-bold text-sm">{user.email}</span>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">System Owner (Bootstrap)</p>
                            </div>
                            <Lock size={16} />
                          </div>
                        )}
                        {allAdmins.length === 0 && user?.email !== "reagandanlugu09@gmail.com" && (
                           <div className="col-span-2 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                             <p className="text-slate-400 text-sm italic">No other admins added.</p>
                           </div>
                        )}
                        {allAdmins.map((admin) => (
                          <div key={admin.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-900 transition-all">
                            <div>
                                <span className="font-bold text-slate-700 text-sm leading-none">{admin.email}</span>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{admin.fullName}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                  setEditingAdminId(admin.id!);
                                  setNewAdmin({ email: admin.email, fullName: admin.fullName });
                                }}
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                                title="Edit Administrator"
                              >
                                <Pencil size={18} />
                              </button>
                              <button 
                                onClick={() => removeAdmin(admin.id!, admin.email)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove Administrator"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Programme Management */}
              {isAdmin && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Programme Management</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add or Remove Academic Programmes / Departments</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 grid lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Plus size={18} className="text-emerald-600" />
                        Add New Programme
                      </h4>
                      <form onSubmit={saveProgramme} className="space-y-4">
                        <Input 
                          label="Programme Name" 
                          placeholder="e.g. Social Studies"
                          value={newDept}
                          onChange={(e: any) => setNewDept(e.target.value)}
                        />
                        <Button type="submit" variant="secondary" className="w-full">Add Programme</Button>
                      </form>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                      <h4 className="font-bold text-slate-900">Current Programmes</h4>
                      <div className="grid sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {departments.map((dept, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-600 transition-all">
                            <span className="font-bold text-slate-700 text-sm">{dept}</span>
                            <button 
                              onClick={() => removeProgramme(dept)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Remove Programme"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Student List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold">Registered Students</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      placeholder="Search by name or index..."
                      className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Index Number</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Level</th>
                        <th className="px-6 py-4">Registered Courses</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allStudents
                        .filter(s => 
                          s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.indexNumber.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((student, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {student.photo ? (
                                <img src={student.photo} className="w-10 h-8 object-cover rounded border border-slate-200" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-8 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
                                  <UserIcon size={12} className="text-slate-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900">{student.fullName}</div>
                                <div className="text-xs text-slate-500">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-slate-600">{student.indexNumber}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-700">{student.department}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">Year {student.year}, Sem {student.semester}</td>
                          <td className="px-6 py-4">
                            {student.registeredCourses && student.registeredCourses.length > 0 ? (
                              <div className="flex -space-x-2 overflow-hidden">
                                {student.registeredCourses.slice(0, 3).map((_, idx) => (
                                  <div key={idx} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center">
                                    <BookOpen size={10} className="text-blue-600" />
                                  </div>
                                ))}
                                {student.registeredCourses.length > 3 && (
                                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    +{student.registeredCourses.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded uppercase">Verified</span>
                              <button 
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to remove ${student.fullName}?`)) {
                                    try {
                                      await deleteDoc(doc(db, 'students', student.uid));
                                    } catch (err) {
                                      handleFirestoreError(err, OperationType.DELETE, `students/${student.uid}`);
                                    }
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all opacity-50 group-hover:opacity-100"
                                title="Delete Student Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : studentData ? (
            <motion.div 
              id="registration-success-view"
              key="registered"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto bg-white p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-8"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900">Registration Successful!</h2>
                <p className="text-slate-500">Your details have been securely recorded in our system.</p>
              </div>

              {studentData.photo && (
                <div className="flex justify-center">
                  <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <img src={studentData.photo} alt="Passport" className="w-[200px] h-[150px] object-cover rounded-md" referrerPolicy="no-referrer" />
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                    <p className="font-bold text-slate-800">{studentData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Index Number</p>
                    <p className="font-bold text-slate-800">{studentData.indexNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                    <p className="font-bold text-slate-800">{studentData.department}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Level</p>
                    <p className="font-bold text-slate-800">Year {studentData.year}, Sem {studentData.semester}</p>
                  </div>
                </div>

                {studentData.registeredCourses && studentData.registeredCourses.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registered Courses</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {studentData.registeredCourses.map((course, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          {course}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  Print Confirmation
                </Button>
                {settings.registrationOpen && (
                  <button 
                    onClick={() => setStudentData(null)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    Edit Registration Details
                  </button>
                )}
              </div>
            </motion.div>
          ) : !isCurrentlyOpen() ? (
            <motion.div 
              key="closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-xl mx-auto bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <Lock size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Registration is Closed</h2>
                <p className="text-slate-500">
                  {getRegistrationStatusMessage()}
                </p>
              </div>
              <Button variant="outline" className="mx-auto" onClick={handleLogout}>
                Sign Out
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              id="registration-form-view"
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                <div className="college-gradient px-8 py-12 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative z-10">
                    <h2 className="text-4xl font-black tracking-tight">Student Registration</h2>
                    <p className="text-red-100 mt-2 font-medium">Complete the form below to register for the current academic session.</p>
                  </div>
                </div>

                <form onSubmit={submitRegistration} className="p-8 sm:p-12 space-y-8">
                  <PhotoUpload value={photoBase64} onChange={setPhotoBase64} />
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Personal Info */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Personal Information</h3>
                      <Input 
                        label="Full Name" 
                        name="fullName" 
                        icon={UserIcon} 
                        placeholder="Enter your full legal name" 
                        required 
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          label="Age" 
                          name="age" 
                          type="number" 
                          icon={Calendar} 
                          placeholder="Age" 
                          required 
                        />
                        <Select 
                          label="Gender" 
                          name="gender" 
                          icon={UserIcon} 
                          options={['Male', 'Female', 'Other']} 
                          required 
                        />
                      </div>
                      <Input 
                        label="Email Address" 
                        value={user.email} 
                        icon={Mail} 
                        disabled 
                        className="bg-slate-100 cursor-not-allowed"
                      />
                    </div>

                    {/* Academic Info */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Academic Details</h3>
                      <Input 
                        label="Index / Reference Number" 
                        name="indexNumber" 
                        icon={Hash} 
                        placeholder="e.g. SJB/2024/001" 
                        required 
                      />
                      <Select 
                        label="Department" 
                        name="department" 
                        icon={BookOpen} 
                        options={departments} 
                        required 
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Select 
                          label="Year" 
                          name="year" 
                          icon={Calendar} 
                          options={[1, 2, 3, 4]} 
                          required 
                          onChange={(e: any) => {
                            setSelectedYear(Number(e.target.value));
                            setSelectedElectives([]);
                          }}
                        />
                        <Select 
                          label="Semester" 
                          name="semester" 
                          icon={Calendar} 
                          options={[1, 2, 3, 4, 5, 6, 7, 8]} 
                          required 
                          onChange={(e: any) => {
                            setSelectedSemester(Number(e.target.value));
                            setSelectedElectives([]);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Course Selection */}
                  {(selectedYear > 0 && selectedSemester > 0) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-900">
                          <div className="w-10 h-10 bg-college-red text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-100">
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black tracking-tight">Level {selectedYear * 100} Course Registration</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semester {selectedSemester}</p>
                          </div>
                        </div>
                      </div>

                      {/* Core Courses */}
                      <div className="space-y-4">
                        <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-2 h-2 bg-college-red rounded-full" />
                          Core Courses (Required)
                        </h5>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {courses.filter(c => c.level === selectedYear * 100 && c.semester === selectedSemester && c.type === 'Core').length > 0 ? (
                            courses.filter(c => c.level === selectedYear * 100 && c.semester === selectedSemester && c.type === 'Core').map((course, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group hover:border-college-red transition-colors">
                                <div className="w-8 h-8 bg-red-50 text-college-red rounded-lg flex items-center justify-center">
                                  <CheckCircle2 size={16} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{course.name}</span>
                              </div>
                            ))
                          ) : selectedYear === 1 && selectedSemester === 1 ? (
                            L100_GENERAL_COURSES.map((course, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group hover:border-college-red transition-colors">
                                <div className="w-8 h-8 bg-red-50 text-college-red rounded-lg flex items-center justify-center">
                                  <CheckCircle2 size={16} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{course}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 italic col-span-2">No core courses defined for this level yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Elective Courses */}
                      {courses.filter(c => c.level === selectedYear * 100 && c.semester === selectedSemester && c.type === 'Elective').length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                          <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                            Elective Courses (Select as applicable)
                          </h5>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {courses.filter(c => c.level === selectedYear * 100 && c.semester === selectedSemester && c.type === 'Elective').map((course, idx) => (
                              <label key={idx} className={cn(
                                "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer group",
                                selectedElectives.includes(course.name) 
                                  ? "bg-emerald-50 border-emerald-200 shadow-sm" 
                                  : "bg-white border-slate-100 hover:border-emerald-200"
                              )}>
                                <input 
                                  type="checkbox" 
                                  className="hidden"
                                  checked={selectedElectives.includes(course.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedElectives([...selectedElectives, course.name]);
                                    } else {
                                      setSelectedElectives(selectedElectives.filter(name => name !== course.name));
                                    }
                                  }}
                                />
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                  selectedElectives.includes(course.name) 
                                    ? "bg-emerald-500 text-white" 
                                    : "bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500"
                                )}>
                                  <Plus size={16} />
                                </div>
                                <span className={cn(
                                  "text-sm font-bold transition-colors",
                                  selectedElectives.includes(course.name) ? "text-emerald-700" : "text-slate-700"
                                )}>{course.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500 max-w-md">
                      By submitting this form, you confirm that all information provided is accurate and belongs to you.
                    </p>
                    <Button type="submit" className="w-full sm:w-auto px-12 py-4 text-lg">
                      Complete Registration
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <School size={20} />
            <span className="text-sm font-medium">© 2026 St. John Bosco College of Education</span>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-slate-500">
            <a href="#" className="hover:text-blue-700 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-700 transition-colors">Academic Calendar</a>
            <a href="#" className="hover:text-blue-700 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

