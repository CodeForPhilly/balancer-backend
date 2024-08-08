import App from "../App";
import RouteError from "../pages/404/404.tsx";
import LoginForm from "../pages/Login/Login.tsx";
import AdminPortal from "../pages/AdminPortal/AdminPortal.tsx";
import ResetPassword from "../pages/Login/ResetPassword.tsx";
import ResetPasswordConfirm from "../pages/Login/ResetPasswordConfirm.tsx";
import DrugSummary from "../pages/DrugSummary/DrugSummary.tsx";
import RegistrationForm from "../pages/Register/Register.tsx";
import About from "../pages/About/About.tsx";
import Feedback from "../pages/Feedback/Feedback.tsx";
import Help from "../pages/Help/Help.tsx";
import HowTo from "../pages/Help/HowTo.tsx";
import DataSources from "../pages/Help/DataSources.tsx";
import Settings from "../pages/Settings/Settings.tsx";
import ListMeds from "../pages/ListMeds/ListMeds.tsx";
import UploadFile from "../pages/DocumentManager/UploadFile.tsx";
import ListofFiles from "../pages/Files/ListOfFiles.tsx";
import NewPatientForm from "../pages/PatientManager/NewPatientForm.tsx";

const routes = [
  {
    path: "/",
    element: <App />,
    errorElement: <RouteError />,
  },
  {
    path: "listoffiles",
    element: <ListofFiles />,
    errorElement: <RouteError />,
  },
  {
    path: "uploadfile",
    element: <UploadFile />,
  },
  {
    path: "drugSummary",
    element: <DrugSummary />,
  },
  {
    path: "register",
    element: <RegistrationForm />,
  },
  {
    path: "login",
    element: <LoginForm />,
  },
  {
    path: "resetPassword",
    element: <ResetPassword />,
  },
  {
    path: "password/reset/confirm/:uid/:token",
    element: <ResetPasswordConfirm />,
  },
  {
    path: "about",
    element: <About />,
  },
  {
    path: "help",
    element: <Help />,
  },
  {
    path: "how-to",
    element: <HowTo />,
  },
  {
    path: "data-sources",
    element: <DataSources />,
  },
  {
    path: "feedback",
    element: <Feedback />,
  },
  {
    path: "adminportal",
    element: <AdminPortal />,
  },
  {
    path: "Settings",
    element: <Settings />,
  },
  {
    path: "medications",
    element: <ListMeds />,
  },
];

export default routes;
