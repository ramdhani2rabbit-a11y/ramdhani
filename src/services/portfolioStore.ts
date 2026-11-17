import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import {
  PortfolioProject,
  CompetencyItem,
  ExperienceItem,
  CertificationItem,
  ProfileData,
  PROJECTS,
  COMPETENCIES,
  EXPERIENCES,
  CERTIFICATIONS,
  STUDENT_PROFILE,
} from '../data/portfolioData';

export function makeSafeDocId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function clampString(val: string, max: number): string {
  return val.trim().slice(0, max);
}

export async function saveProjectToFirestore(
  project: PortfolioProject,
  authorUid: string,
  existsInFirestore: boolean
) {
  const path = `projects/${project.id}`;
  const cleanComponents = project.components
    .map((c) => clampString(c, 120))
    .filter(Boolean)
    .slice(0, 12);
  const cleanSpecs = project.specs
    .map((s) => ({
      label: clampString(s.label, 80),
      value: clampString(s.value, 80),
    }))
    .filter((s) => s.label.length > 0 && s.value.length > 0)
    .slice(0, 10);

  const mutableFields = {
    title: clampString(project.title, 160),
    category: project.category,
    year: clampString(project.year, 4),
    systemSpec: clampString(project.systemSpec, 80),
    featured: Boolean(project.featured),
    imageUrl: clampString(project.imageUrl || '', 500),
    summary: clampString(project.summary, 600),
    challenge: clampString(project.challenge, 800),
    solution: clampString(project.solution, 800),
    standardRef: clampString(project.standardRef, 120),
    role: clampString(project.role, 120),
    components: cleanComponents,
    specs: cleanSpecs,
    sortOrder: Number(project.sortOrder ?? 1),
    isPublished: project.isPublished ?? true,
    updatedAt: serverTimestamp(),
  };

  try {
    if (existsInFirestore) {
      await updateDoc(doc(db, 'projects', project.id), mutableFields);
    } else {
      await setDoc(doc(db, 'projects', project.id), {
        ...mutableFields,
        authorUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existsInFirestore ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteProjectFromFirestore(projectId: string) {
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCompetencyToFirestore(
  item: CompetencyItem,
  authorUid: string,
  existsInFirestore: boolean
) {
  const path = `competencies/${item.id}`;
  const mutableFields = {
    number: clampString(item.number, 12),
    title: clampString(item.title, 140),
    description: clampString(item.description, 600),
    tools: clampString(item.tools, 200),
    sortOrder: Number(item.sortOrder ?? 1),
    isPublished: item.isPublished ?? true,
    updatedAt: serverTimestamp(),
  };

  try {
    if (existsInFirestore) {
      await updateDoc(doc(db, 'competencies', item.id), mutableFields);
    } else {
      await setDoc(doc(db, 'competencies', item.id), {
        ...mutableFields,
        authorUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existsInFirestore ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteCompetencyFromFirestore(id: string) {
  const path = `competencies/${id}`;
  try {
    await deleteDoc(doc(db, 'competencies', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveExperienceToFirestore(
  item: ExperienceItem,
  authorUid: string,
  existsInFirestore: boolean
) {
  const path = `experiences/${item.id}`;
  const cleanHighlights = item.highlights
    .map((h) => clampString(h, 400))
    .filter(Boolean)
    .slice(0, 8);

  const mutableFields = {
    period: clampString(item.period, 80),
    role: clampString(item.role, 140),
    organization: clampString(item.organization, 160),
    location: clampString(item.location, 100),
    highlights: cleanHighlights,
    sortOrder: Number(item.sortOrder ?? 1),
    isPublished: item.isPublished ?? true,
    updatedAt: serverTimestamp(),
  };

  try {
    if (existsInFirestore) {
      await updateDoc(doc(db, 'experiences', item.id), mutableFields);
    } else {
      await setDoc(doc(db, 'experiences', item.id), {
        ...mutableFields,
        authorUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existsInFirestore ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteExperienceFromFirestore(id: string) {
  const path = `experiences/${id}`;
  try {
    await deleteDoc(doc(db, 'experiences', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCertificationToFirestore(
  item: CertificationItem,
  authorUid: string,
  existsInFirestore: boolean
) {
  const path = `certifications/${item.id}`;
  const mutableFields = {
    year: clampString(item.year, 4),
    name: clampString(item.name, 180),
    issuer: clampString(item.issuer, 160),
    credentialCode: clampString(item.credentialCode, 60),
    scope: clampString(item.scope, 240),
    sortOrder: Number(item.sortOrder ?? 1),
    isPublished: item.isPublished ?? true,
    updatedAt: serverTimestamp(),
  };

  try {
    if (existsInFirestore) {
      await updateDoc(doc(db, 'certifications', item.id), mutableFields);
    } else {
      await setDoc(doc(db, 'certifications', item.id), {
        ...mutableFields,
        authorUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existsInFirestore ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteCertificationFromFirestore(id: string) {
  const path = `certifications/${id}`;
  try {
    await deleteDoc(doc(db, 'certifications', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveProfileToFirestore(
  profile: ProfileData,
  authorUid: string,
  existsInFirestore: boolean
) {
  const path = 'portfolioProfile/main';
  const mutableFields = {
    fullName: clampString(profile.fullName, 100),
    shortBrand: clampString(profile.shortBrand, 50),
    program: clampString(profile.program, 120),
    school: clampString(profile.school, 120),
    location: clampString(profile.location, 100),
    email: clampString(profile.email, 150),
    phone: clampString(profile.phone, 40),
    headline: clampString(profile.headline, 160),
    lead: clampString(profile.lead, 500),
    availability: clampString(profile.availability, 180),
    testimonialQuote: clampString(profile.testimonialQuote, 600),
    testimonialAuthor: clampString(profile.testimonialAuthor, 100),
    testimonialRole: clampString(profile.testimonialRole, 120),
    testimonialOrg: clampString(profile.testimonialOrg, 140),
    isPublished: true,
    updatedAt: serverTimestamp(),
  };

  try {
    if (existsInFirestore) {
      await updateDoc(doc(db, 'portfolioProfile', 'main'), mutableFields);
    } else {
      await setDoc(doc(db, 'portfolioProfile', 'main'), {
        ...mutableFields,
        authorUid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existsInFirestore ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function seedDefaultPortfolioToFirestore(
  authorUid: string,
  existingFlags: {
    hasProfile: boolean;
    existingProjectIds: Set<string>;
    existingCompetencyIds: Set<string>;
    existingExperienceIds: Set<string>;
    existingCertificationIds: Set<string>;
  }
) {
  const batch = writeBatch(db);
  let writeCount = 0;

  if (!existingFlags.hasProfile) {
    batch.set(doc(db, 'portfolioProfile', 'main'), {
      fullName: STUDENT_PROFILE.fullName,
      shortBrand: STUDENT_PROFILE.shortBrand,
      program: STUDENT_PROFILE.program,
      school: STUDENT_PROFILE.school,
      location: STUDENT_PROFILE.location,
      email: STUDENT_PROFILE.email,
      phone: STUDENT_PROFILE.phone,
      headline: STUDENT_PROFILE.headline,
      lead: STUDENT_PROFILE.lead,
      availability: STUDENT_PROFILE.availability,
      testimonialQuote: STUDENT_PROFILE.testimonialQuote,
      testimonialAuthor: STUDENT_PROFILE.testimonialAuthor,
      testimonialRole: STUDENT_PROFILE.testimonialRole,
      testimonialOrg: STUDENT_PROFILE.testimonialOrg,
      isPublished: true,
      authorUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    writeCount++;
  }

  PROJECTS.forEach((p, idx) => {
    if (!existingFlags.existingProjectIds.has(p.id)) {
      batch.set(doc(db, 'projects', p.id), {
        title: p.title,
        category: p.category,
        year: p.year,
        systemSpec: p.systemSpec,
        featured: Boolean(p.featured),
        imageUrl: p.imageUrl || '',
        summary: p.summary,
        challenge: p.challenge,
        solution: p.solution,
        standardRef: p.standardRef,
        role: p.role,
        components: p.components,
        specs: p.specs,
        sortOrder: p.sortOrder ?? idx + 1,
        isPublished: true,
        authorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      writeCount++;
    }
  });

  COMPETENCIES.forEach((c, idx) => {
    if (!existingFlags.existingCompetencyIds.has(c.id)) {
      batch.set(doc(db, 'competencies', c.id), {
        number: c.number,
        title: c.title,
        description: c.description,
        tools: c.tools,
        sortOrder: c.sortOrder ?? idx + 1,
        isPublished: true,
        authorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      writeCount++;
    }
  });

  EXPERIENCES.forEach((e, idx) => {
    if (!existingFlags.existingExperienceIds.has(e.id)) {
      batch.set(doc(db, 'experiences', e.id), {
        period: e.period,
        role: e.role,
        organization: e.organization,
        location: e.location,
        highlights: e.highlights,
        sortOrder: e.sortOrder ?? idx + 1,
        isPublished: true,
        authorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      writeCount++;
    }
  });

  CERTIFICATIONS.forEach((cert, idx) => {
    if (!existingFlags.existingCertificationIds.has(cert.id)) {
      batch.set(doc(db, 'certifications', cert.id), {
        year: cert.year,
        name: cert.name,
        issuer: cert.issuer,
        credentialCode: cert.credentialCode,
        scope: cert.scope,
        sortOrder: cert.sortOrder ?? idx + 1,
        isPublished: true,
        authorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      writeCount++;
    }
  });

  if (writeCount === 0) return;

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'portfolio_seed_batch');
  }
}
