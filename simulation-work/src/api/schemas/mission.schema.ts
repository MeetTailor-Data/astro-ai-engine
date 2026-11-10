
import { z } from "zod";

export const customMissionSchema = z.object({
  name: z.string().trim().min(1, "Mission name is required"),
  durationSeconds: z.number().finite().positive(),
  altitudeKm: z.number().finite().positive(),
  batteryCapacityWh: z.number().finite().positive(),
  panelAreaM2: z.number().finite().positive(),
  powerConsumedW: z.number().finite().nonnegative(),
  dataRateMbps: z.number().finite().nonnegative(),
}).strict();

export type ValidCustomMission = z.infer<typeof customMissionSchema>;
