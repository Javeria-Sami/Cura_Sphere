import { useEditionStore } from "../../../stores/editionStore";
import HospitalDashboardPage from "./HospitalDashboardPage";
import ClinicDashboardPage from "./ClinicDashboardPage";

/**
 * Edition-aware Root Dashboard Router.
 * Automatically serves the dedicated Clinic Edition dashboard for Clinic deployments,
 * or the full Hospital Edition operational dashboard for Hospital deployments.
 */
export default function DashboardPage() {
  const currentEdition = useEditionStore((state) => state.currentEdition);

  if (currentEdition === "Clinic") {
    return <ClinicDashboardPage />;
  }

  return <HospitalDashboardPage />;
}
