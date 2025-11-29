
import { db } from '../lib/db';
import { createUser, findUserByUsername, updateUser } from '../lib/db-postgres';

async function main() {
  console.log('Sprawdzanie istnienia Robota Roberta...');
  const username = 'robot_robert';
  const email = 'robot@polutek.app';

  try {
    let user = await findUserByUsername(username);

    if (user) {
      console.log('Robot Robert już istnieje.');
      if (!user.isRobot) {
        console.log('Aktualizacja flagi isRobot...');
        await updateUser(user.id, { isRobot: true });
        console.log('Zaktualizowano.');
      }
    } else {
      console.log('Tworzenie Robota Roberta...');
      user = await createUser({
        username,
        email,
        password: 'secure_password_placeholder_robot', // Bot won't login via password usually
        displayName: 'Robot Robert',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robert', // Example avatar
        role: 'user', // Basic role, but with isRobot flag
        // isRobot will be set by default logic if we update createUser or we update it after
      });

      // Update specifically for isRobot as createUser might not support it in arguments yet
      await updateUser(user.id, { isRobot: true });
      console.log('Utworzono Robota Roberta.');
    }
  } catch (error) {
    console.error('Błąd podczas seedowania robota:', error);
  }
}

main().catch(console.error);
