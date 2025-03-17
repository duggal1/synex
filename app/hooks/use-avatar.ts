import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export const useAvatar = () => {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string>("/icons/avatar.png");

  useEffect(() => {
    const fetchAvatar = async () => {
      if (session?.user?.image) {
        try {
          const response = await fetch(session.user.image);
          if (response.ok) {
            setAvatarUrl(session.user.image);
          } else {
            setAvatarUrl("/icons/avatar.png");
          }
        } catch (error) {
          console.error("Error fetching avatar:", error);
          setAvatarUrl("/icons/avatar.png");
        }
      }
    };

    fetchAvatar();
  }, [session?.user?.image]);

  return avatarUrl;
};
