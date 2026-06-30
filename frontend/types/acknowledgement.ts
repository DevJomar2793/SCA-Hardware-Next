export type AcknowledgementSignatoryKey = "prepared_by";

export interface AcknowledgementSignature {
  id: number;
  assignment_id: number;
  signatory_key: AcknowledgementSignatoryKey;
  signature_data: string;
  created_at: string | null;
  updated_at: string | null;
}
