export interface EHRResourceIdentifier {
  key: string;
  uid: string;
  patientId: string;
}

export enum ProcessingState {
  PROCESSING_STATE_UNSPECIFIED = "PROCESSING_STATE_UNSPECIFIED",
  PROCESSING_STATE_NOT_STARTED = "PROCESSING_STATE_NOT_STARTED",
  PROCESSING_STATE_PROCESSING = "PROCESSING_STATE_PROCESSING",
  PROCESSING_STATE_COMPLETED = "PROCESSING_STATE_COMPLETED",
  PROCESSING_STATE_FAILED = "PROCESSING_STATE_FAILED",
}

export enum FHIRVersion {
  FHIR_VERSION_UNSPECIFIED = "FHIR_VERSION_UNSPECIFIED",
  FHIR_VERSION_R4 = "FHIR_VERSION_R4",
  FHIR_VERSION_R4B = "FHIR_VERSION_R4B",
}

export interface EHRResourceMetadata {
  state: ProcessingState;
  createdTime: string; // ISO string
  fetchTime: string;   // ISO string
  processedTime?: string; // ISO string, optional
  identifier: EHRResourceIdentifier;
  resourceType: string;
  version: FHIRVersion;
}

export interface EHRResourceJson {
  metadata: EHRResourceMetadata;
  humanReadableStr: string;
  aiSummary?: string; // Optional
}

export interface ResourceWrapper {
  resource: EHRResourceJson;
  // Firestore doc id (attached client-side)
  __id?: string;
}
