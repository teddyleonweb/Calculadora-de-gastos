export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="container mx-auto p-4 text-center">
        <p className="text-gray-600">&copy; {new Date().getFullYear()} MyMoney - by Somedia</p>
      </div>
    </footer>
  )
}
