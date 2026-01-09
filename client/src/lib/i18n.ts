import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "Profile Settings": "Profile Settings",
      "Manage your account information": "Manage your account information",
      "Full Name": "Full Name",
      "Email": "Email",
      "Email cannot be changed": "Email cannot be changed",
      "Phone Number": "Phone Number",
      "Bio": "Bio",
      "Service Categories": "Service Categories",
      "Language Settings": "Language Settings",
      "Select your preferred language": "Select your preferred language",
      "Save Changes": "Save Changes",
      "Saving...": "Saving...",
      "Profile updated": "Profile updated",
      "Your profile has been updated successfully.": "Your profile has been updated successfully.",
      "Browse Jobs": "Browse Jobs",
      "Post a Job": "Post a Job",
      "Dashboard": "Dashboard",
      "Messages": "Messages",
      "Profile": "Profile",
      "English": "English",
      "Setswana": "Setswana",
      "French": "French",
      "Spanish": "Spanish"
    }
  },
  tn: {
    translation: {
      "Profile Settings": "Di-setting tsa Profile",
      "Manage your account information": "Laola tshedimosetso ya gago ya akhaonto",
      "Full Name": "Leina le le tletseng",
      "Email": "Imeile",
      "Email cannot be changed": "Imeile ga e kake ya fetolwa",
      "Phone Number": "Nomore ya mogala",
      "Bio": "Bio",
      "Service Categories": "Mefuta ya ditiro",
      "Language Settings": "Di-setting tsa puo",
      "Select your preferred language": "Tlhopha puo e o e ratang",
      "Save Changes": "Boloka diphetogo",
      "Saving...": "Go a bolokwa...",
      "Profile updated": "Profile e ntšhwafaditswe",
      "Your profile has been updated successfully.": "Profile ya gago e ntšhwafaditswe ka katlego.",
      "Browse Jobs": "Batla ditiro",
      "Post a Job": "Beha tiro",
      "Dashboard": "Dashboard",
      "Messages": "Melaetsa",
      "Profile": "Profile",
      "English": "Sekgoa",
      "Setswana": "Setswana",
      "French": "Sefora",
      "Spanish": "Sepanish"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
