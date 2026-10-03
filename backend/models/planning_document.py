"""
PlanningContainer v2 — Modelo Pydantic canónico para Unidades, Proyectos y Experiencias de Aprendizaje.

Basado en el esquema canónico PlanningContainer 2.0 (schemas/planning-container.v2.schema.json).
Valida y normaliza planificaciones de aula del Currículo Nacional (CNEB / MINEDU Perú).
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional, Union, Literal
from pydantic import BaseModel, Field


class PlanningIdentity(BaseModel):
    title: str = Field(default="", description="Título oficial de la unidad o proyecto")
    planningType: Literal["unit", "project", "learning_experience", "context"] = "unit"
    level: Literal["initial", "primary", "secondary"] = "secondary"
    cycle: Optional[str] = "VI"
    grade: Optional[str] = "1"
    age: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    duration: Optional[Dict[str, Any]] = Field(default_factory=lambda: {"value": 4, "unit": "weeks"})


class AdministrativeContext(BaseModel):
    institution: str = Field(default="", description="Nombre de la Institución Educativa")
    dre: str = Field(default="", description="Dirección Regional de Educación")
    ugel: str = Field(default="", description="Unidad de Gestión Educativa Local")
    teacher: str = Field(default="", description="Nombre del docente responsable")
    director: str = Field(default="", description="Nombre del director(a)")
    academicYear: Union[str, int] = "2026"
    period: str = Field(default="", description="Bimestre o trimestre")
    sections: List[str] = Field(default_factory=list)


class LearnerContext(BaseModel):
    students: Optional[str] = ""
    diagnosis: Optional[str] = ""
    interests: List[str] = Field(default_factory=list)
    localContext: Optional[str] = ""


class SignificantSituation(BaseModel):
    context: Optional[str] = Field(default="", description="Contexto real de la comunidad o escuela")
    problemOrOpportunity: Optional[str] = Field(default="", description="Problema, reto o desafío")
    affectedActors: List[str] = Field(default_factory=list)
    relevance: Optional[str] = ""
    studentRole: Optional[str] = ""
    expectedResponse: Optional[str] = ""


class Purpose(BaseModel):
    summary: Optional[str] = ""
    what: Optional[str] = ""
    why: Optional[str] = ""
    context: Optional[str] = ""


class MethodologyConfig(BaseModel):
    primary: Optional[Dict[str, Any]] = None
    supportingStrategies: List[Dict[str, Any]] = Field(default_factory=list)
    custom: Optional[Dict[str, Any]] = None
    challenge: Optional[Dict[str, Any]] = None


class NamedItem(BaseModel):
    id: str = ""
    officialName: str = ""
    alias: Optional[str] = None


class StandardItem(BaseModel):
    description: str = ""
    sourceRef: Optional[str] = "minedu-secondary-curriculum-2016"


class DescriptionItem(BaseModel):
    id: str = ""
    description: str = ""
    instrument: Optional[str] = None


class CurriculumMapEntry(BaseModel):
    id: str = ""
    area: NamedItem = Field(default_factory=NamedItem)
    competency: NamedItem = Field(default_factory=NamedItem)
    capacities: List[NamedItem] = Field(default_factory=list)
    standard: Optional[StandardItem] = None
    performances: List[DescriptionItem] = Field(default_factory=list)
    criteria: List[DescriptionItem] = Field(default_factory=list)
    expectedEvidence: List[DescriptionItem] = Field(default_factory=list)
    curricularSourceRefs: List[str] = Field(default_factory=list)


class TransversalElement(BaseModel):
    id: str = ""
    name: str = ""
    valuesOrAttitudes: List[str] = Field(default_factory=list)


class FinalProduct(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = ""
    description: Optional[str] = ""
    type: Optional[str] = None
    expectedComponents: List[str] = Field(default_factory=list)
    audience: Optional[str] = None
    criterionRefs: List[str] = Field(default_factory=list)


class Milestone(BaseModel):
    id: str = ""
    title: str = ""
    phase: Optional[str] = None
    objective: Optional[str] = ""
    partialProduct: Optional[Dict[str, Any]] = None
    sequenceItemIds: List[str] = Field(default_factory=list)
    completionCriteria: List[str] = Field(default_factory=list)


class SequenceItem(BaseModel):
    id: str = ""
    index: int = 1
    type: str = "session"
    title: str = ""
    week: Optional[int] = 1
    date: Optional[str] = None
    duration: Optional[Dict[str, Any]] = Field(default_factory=lambda: {"value": 90, "unit": "minutes"})
    milestoneId: Optional[str] = None
    curriculumMapRefs: List[str] = Field(default_factory=list)
    competencyRefs: List[str] = Field(default_factory=list)
    capacityRefs: List[str] = Field(default_factory=list)
    criterionRefs: List[str] = Field(default_factory=list)
    knowledge: List[str] = Field(default_factory=list)
    activities: List[str] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    partialProduct: Optional[Dict[str, Any]] = None
    assessmentInstruments: List[Dict[str, Any]] = Field(default_factory=list)
    linkedDocumentRef: Optional[Dict[str, Any]] = None
    status: str = "planned"


class AssessmentPlan(BaseModel):
    formativeAssessment: Optional[str] = ""
    feedbackApproach: Optional[str] = ""
    selfAssessment: Optional[str] = ""
    peerAssessment: Optional[str] = ""
    teacherAssessment: Optional[str] = ""
    recommendedInstruments: List[str] = Field(default_factory=list)


class ResourceItem(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = ""
    type: Optional[str] = None
    url: Optional[str] = None


class BibliographyItem(BaseModel):
    id: Optional[str] = None
    citation: Optional[str] = ""
    url: Optional[str] = None


class AuditInfo(BaseModel):
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    author: Optional[str] = None


class PlanningContainerV2(BaseModel):
    schemaVersion: Literal["2.0"] = "2.0"
    id: str
    revision: int = 1
    status: Literal["draft", "reviewed", "archived"] = "draft"
    identity: PlanningIdentity
    administrativeContext: AdministrativeContext = Field(default_factory=AdministrativeContext)
    learnerContext: LearnerContext = Field(default_factory=LearnerContext)
    significantSituation: SignificantSituation = Field(default_factory=SignificantSituation)
    drivingQuestion: Optional[str] = ""
    purpose: Purpose = Field(default_factory=Purpose)
    methodologyConfig: MethodologyConfig = Field(default_factory=MethodologyConfig)
    curriculumMap: List[CurriculumMapEntry] = Field(default_factory=list)
    transversalElements: List[TransversalElement] = Field(default_factory=list)
    finalProduct: Optional[FinalProduct] = None
    milestones: List[Milestone] = Field(default_factory=list)
    sequence: List[SequenceItem] = Field(default_factory=list)
    assessmentPlan: AssessmentPlan = Field(default_factory=AssessmentPlan)
    resources: List[Union[ResourceItem, str, Dict[str, Any]]] = Field(default_factory=list)
    bibliography: List[Union[BibliographyItem, str, Dict[str, Any]]] = Field(default_factory=list)
    audit: AuditInfo = Field(default_factory=AuditInfo)
