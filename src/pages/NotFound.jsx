export default function NotFound() {
  return (
    <div className="p-3 space-y-2">
      <p>hey there!</p>

      <p>looking for something you couldn&apos;t find?</p>
      <p>
        <a className="text-blue-600" href="mailto:drawdb@outlook.com">
          shoot us an email
        </a>{" "}
        or{" "}
        <a
          className="text-blue-600"
          href="https://discord.com/invite/8y7XUfcqR8"
        >
          a message on discord
        </a>
      </p>
      <br />
      <p className="opacity-70">
        * to create a relationship hold the blue dot of a field and drag it
        towards the field you want to connect it to
      </p>
    </div>
  );
}
