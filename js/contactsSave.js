/**
 * Creates a new contact, saves it to the database, and updates the contact list.
 * Displays a success message and reloads the contact list.
 * 
 * @async
 * @function
 */
async function createNewContact() {
    const name = document.getElementById('newContactName').value;
    const email = document.getElementById('newContactEmail').value;
    const phone = document.getElementById('newContactPhone').value;
    clearErrorMessages();
    if (validateContactInputs(name, email, phone)) {
        const contactId = generateRandomId();
        const newContact = createContactObject(name, email, phone, contactId);
        try {
            await saveDataToFirebase(contactId, newContact);
            updateContactList(newContact);
            closeNewContact();
            successfullCreationContact();
            await loadContacts();
        } catch (error) {
            console.error('Error creating new contact:', error);
        }
    }
}

/**
 * Generates a unique identifier (UUID) for a contact.
 * 
 * @function
 * @returns {string} A unique ID string in the format 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.
 */
function generateRandomId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Displays a success message pop-up when a new contact is successfully created.
 * 
 * @function
 */
function successfullCreationContact() {
    let overlay = document.getElementById('createContactSuccessfull');
    let container = overlay.querySelector('.create-contact-successfull-container');
    overlay.style.display = 'flex';
    container.style.animation = 'slideInFromRight 0.4s forwards';
    setTimeout(() => {
        container.style.animation = 'slideOutToRight 0.4s forwards';
        setTimeout(() => {
            overlay.style.display = 'none';
            container.style.animation = '';
        }, 400);
    }, 1500);
}

///////////////////////////////////PHILIPS OLD CODE TO EDIT CONTACT///////////////////////////////////////////////

// /**
//  * Saves the edited contact data to the database and updates the contact list.
//  * Refreshes the page to reflect changes.
//  * 
//  * @async
//  * @function
//  */
// async function saveEditingContact() {
//     const originalContactId = getOriginalContactId();
//     if (!originalContactId) {
//         console.error('Original Contact ID is undefined.');
//         return;
//     }
//     const name = document.getElementById('contactName').value;
//     const email = document.getElementById('contactMailAdress').value;
//     const phone = document.getElementById('contactPhone').value;
//     clearErrorMessages();
//     if (!validateContactInputs(name, email, phone)) {
//         console.error('Please fix the errors before saving.');
//         return;
//     }
//     const contactData = createContactData();
//     try {
//         await updateContactInDatabase(originalContactId, contactData);
//         updateContactList(originalContactId, contactData);
//         closeEditContact();
//         location.reload();
//     } catch (error) {
//         console.error('Error saving contact:', error);
//     }
// }


//////////////////////////////////////////////BORIS CHANGES EDIT CONTACT + UPDATE ASSIGNET TO/////////////////////////////////////////////////////////////

/**
 * Saves the edited contact data to the database and updates the contact list.
 * Also updates the contact in all assigned tasks.
 * Refreshes the page to reflect changes.
 * 
 * @async
 * @function
 */
async function saveEditingContact() {
    const originalContactId = getOriginalContactId();
    if (!originalContactId) {
        console.error('Original Contact ID is undefined.');
        return;
    }
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactMailAdress').value;
    const phone = document.getElementById('contactPhone').value;
    clearErrorMessages();
    if (!validateContactInputs(name, email, phone)) {
        console.error('Please fix the errors before saving.');
        return;
    }
    const contactData = createContactData();
    try {
        await updateContactInDatabase(originalContactId, contactData);
        await updateContactInTasks(originalContactId, contactData);
        updateContactList(originalContactId, contactData);
        closeEditContact();
        location.reload();
    } catch (error) {
        console.error('Error saving contact:', error);
    }
}

/**
 * Updates the assigned contacts in all tasks based on the updated contact data.
 *
 * @async
 * @function
 * @param {string} contactId - The ID of the contact to update.
 * @param {Object} updatedContactData - The updated contact data.
 */
async function updateContactInTasks(contactId, updatedContactData) {
    try {
        const tasks = await getData('tasks');
        if (!tasks) return;

        const updatedTasks = processTasks(tasks, contactId, updatedContactData);

        await saveUpdatedTasks(updatedTasks);
    } catch (error) {
        console.error('Error updating contact in tasks:', error);
    }
}

/**
 * Processes tasks to update the assigned contact information.
 *
 * @function
 * @param {Object} tasks - The tasks to process.
 * @param {string} contactId - The ID of the contact to update.
 * @param {Object} updatedContactData - The updated contact data.
 * @returns {Object} The tasks with updated assigned contact information.
 */
function processTasks(tasks, contactId, updatedContactData) {
    const updatedTasks = {};

    for (const [taskId, task] of Object.entries(tasks)) {
        const updatedAssignedTo = updateAssignedTo(task.Assigned_to, contactId, updatedContactData);

        updatedTasks[taskId] = {
            ...task,
            Assigned_to: updatedAssignedTo
        };
    }
    return updatedTasks;
}

/**
 * Updates the assigned contact information in a task.
 *
 * @function
 * @param {Object|Array} assignedTo - The current assigned contacts.
 * @param {string} contactId - The ID of the contact to update.
 * @param {Object} updatedContactData - The updated contact data.
 * @returns {Object|Array} The updated assigned contacts.
 */
function updateAssignedTo(assignedTo, contactId, updatedContactData) {
    if (Array.isArray(assignedTo)) {
        return assignedTo.map(contact =>
            contact.id === contactId ? { ...contact, ...updatedContactData } : contact
        );
    } else if (typeof assignedTo === 'object') {
        return Object.fromEntries(
            Object.entries(assignedTo).map(([key, contact]) =>
                contact.id === contactId ? [key, { ...contact, ...updatedContactData }] : [key, contact]
            )
        );
    }
    return assignedTo;
}

/**
 * Saves the updated tasks to the database.
 *
 * @async
 * @function
 * @param {Object} updatedTasks - The tasks to save.
 */
async function saveUpdatedTasks(updatedTasks) {
    await putData('tasks', updatedTasks);
}


//////////////////////////////////////////////////////////AB HIER WIEDER PHILIPS CODE////////////////////////////////////////////////////////////////

/**
 * Retrieves the ID of the contact currently being edited from the DOM.
 * 
 * @function
 * @returns {string} The ID of the contact being edited.
 */
function getOriginalContactId() {
    return document.getElementById('editContact').dataset.originalContactId;
}

/**
 * Creates a contact data object from the values in the edit contact form.
 * 
 * @function
 * @returns {Object} An object containing the contact data with id, name, email, phone, and color properties.
 */
function createContactData() {
    return {
        id: getOriginalContactId(),
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactMailAdress').value,
        phone: document.getElementById('contactPhone').value,
        color: getRandomColor()
    };
}

/**
 * Updates a contact in the database with the given contact data.
 * 
 * @async
 * @function
 * @param {string} originalContactId - The ID of the contact to update.
 * @param {Object} contactData - The data to update the contact with.
 */
async function updateContactInDatabase(originalContactId, contactData) {
    await saveDataToFirebase(originalContactId, contactData);
}

/**
 * Updates an existing contact in the contact list.
 * If the contact with the specified ID exists, it is updated with the new data.
 * 
 * @function
 * @param {string} id - The ID of the contact to update.
 * @param {Object} contactData - The new data for the contact.
 */
function updateExistingContact(id, contactData) {
    const index = contacts.findIndex(contact => contact.id === id);
    if (index !== -1) {
        contacts[index] = { id, ...contactData };
    }
}