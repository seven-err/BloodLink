export const DONATION_QR_VERSION = 1 as const;
export const DONATION_QR_TYPE = 'bloodlink-donation' as const;

export type DonationQrPayload = {
  v: typeof DONATION_QR_VERSION;
  type: typeof DONATION_QR_TYPE;
  donation_id: string;
  token: string;
};

export const buildDonationQrPayload = (
  donationId: string,
  verificationToken: string,
): DonationQrPayload => ({
  v: DONATION_QR_VERSION,
  type: DONATION_QR_TYPE,
  donation_id: donationId,
  token: verificationToken,
});

export const serializeDonationQrPayload = (payload: DonationQrPayload): string =>
  JSON.stringify(payload);
