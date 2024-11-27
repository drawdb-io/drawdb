import { useLocation } from 'react-router-dom';

export default function NotFound() {
  const location = useLocation(); // Obtiene la ubicación actual

  return (
    <div className="p-3 space-y-2">
      <p>Hey there!</p>

      <p>Looking for something you couldn&apos;t find?</p>
      <p>
        <a className="text-blue-600" href="mailto:drawdb@outlook.com">
          Shoot us an email
        </a>{" "}
        or{" "}
        <a className="text-blue-600" href="https://discord.gg/BrjZgNrmR6">
          a message on Discord
        </a>
      </p>
      <br />
      <p className="opacity-70">
        The page you were looking for: <strong>{location.pathname}</strong> does not exist.
      </p>
      <br />
      <p className="opacity-70">
        * To create a relationship, hold the blue dot of a field and drag it
        towards the field you want to connect it to.
      </p>
    </div>
  );
}
