import * as Contacts from 'expo-contacts';
import api from '../api';

interface Contact {
  id: string;
  name: string;
  phoneNumbers?: { number: string; label: string }[];
  emails?: { email: string; label: string }[];
  image?: { uri: string };
}

interface MatchedContact {
  contact: Contact;
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  isFriend: boolean;
}

class ContactsService {
  // Get all contacts
  public getContacts = async (): Promise<Contact[]> => {
    try {
      // Request permission
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permission to access contacts was denied');
      }

      // Get all contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.ID,
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Image,
        ],
      });

      return data as Contact[];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  };

  // Find contacts that match users in the app
  public findMatchingContacts = async (): Promise<MatchedContact[]> => {
    try {
      // Get all contacts
      const contacts = await this.getContacts();

      // Extract phone numbers and emails
      const contactData = contacts.map((contact) => ({
        id: contact.id,
        phoneNumbers: contact.phoneNumbers?.map((phone) => phone.number) || [],
        emails: contact.emails?.map((email) => email.email) || [],
      }));

      // Send to backend to find matches
      const response = await api.post('/friends/match-contacts', {
        contacts: contactData,
      });

      // Map matched users to contacts
      const matchedContacts: MatchedContact[] = response.data.matches.map(
        (match: any) => ({
          contact: contacts.find((contact) => contact.id === match.contactId) as Contact,
          user: match.user,
          isFriend: match.isFriend,
        })
      );

      return matchedContacts;
    } catch (error) {
      console.error('Error finding matching contacts:', error);
      throw error;
    }
  };

  // Format phone number to E.164 format
  public formatPhoneNumber = (phoneNumber: string): string => {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check if it already has a country code
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return `+${cleaned}`;
    }

    // Assume US number if 10 digits
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    // Return as is with + prefix if not recognized
    return `+${cleaned}`;
  };
}

export default new ContactsService();

