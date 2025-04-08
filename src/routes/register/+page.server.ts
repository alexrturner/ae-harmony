import { fail } from "@sveltejs/kit";

function getRandomColor() {
    const colors = [
      '#008080', // Teal
      '#008000 ', // Green
      '#FFA500', // Orange
      '#FF0000', // Red
      '#FF00FF', // fuchsia
      '#ECC94B', // Yellow
      '#00FF00', // Lime
      '#0000FF', // Blue
      '#800000', // Maroon
      '#800080', // Purple
      '#000080', // Navy
      '#00FFFF'  // Aqua
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }

export const actions: Actions = {
  default: async ({ locals, request }) => {
    
    const body = await request.formData();
    const userData = Object.fromEntries(body);
    
    userData.colour = getRandomColor();
    
    try {
      // Create the user with the random colour
      await locals.pb.collection('users').create(userData);
      await locals.pb.collection('users').authWithPassword(userData.email, userData.password);
      
    } catch (err) {
      // oop
      console.error('Registration error:', err);
    return fail(500, { 
      error: 'Registration failed. Please try again.' 
    });
    }
  }
}; 