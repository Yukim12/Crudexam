import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { db, storage } from './firebaseConfig';
import './App.css';

function App() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    imagen: null
  });
  const [productoActualizado, setProductoActualizado] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    precio: '',
    imagen: null
  });
  const [mostrarFormularioActualizar, setMostrarFormularioActualizar] = useState(false);
  const [reloadPage, setReloadPage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerProductos();
  }, [reloadPage]);

  const obtenerProductos = async () => {
    const productosRef = collection(db, 'ProductosMEX');
    const q = query(productosRef, orderBy('nombre'));
    const productosSnapshot = await getDocs(q);
    const productosData = [];
    await Promise.all(productosSnapshot.docs.map(async doc => {
      const productoData = doc.data();
      const imagenRef = ref(storage, `${doc.id}.jpg`);
      try {
        const url = await getDownloadURL(imagenRef);
        productosData.push({ id: doc.id, ...productoData, imagenUrl: url });
      } catch (error) {
        console.error(`Error al obtener la imagen para el producto con ID ${doc.id}:`, error);
        productosData.push({ id: doc.id, ...productoData, imagenUrl: null });
      }
    }));
    setProductos(productosData);
  };

  const handleInputChange = (e) => {
    setBusqueda(e.target.value);
    setError('');
  };

  const filtrarProductos = (productos, busqueda) => {
    return productos.filter(producto =>
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  const handleNuevoProductoChange = (e) => {
    const { name, value } = e.target;
    setNuevoProducto(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError('');
  };

  const handleImagenChange = (e) => {
    const imagen = e.target.files[0];
    setNuevoProducto(prevState => ({
      ...prevState,
      imagen
    }));
    setError('');
  };

  const handleProductoActualizadoChange = (e) => {
    const { name, value } = e.target;
    setProductoActualizado(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError('');
  };

  const mostrarFormulario = (producto) => {
    setProductoActualizado(producto);
    setMostrarFormularioActualizar(true);
    setError('');
  };

  const ocultarFormulario = () => {
    setMostrarFormularioActualizar(false);
    setError('');
  };

  const agregarProducto = async () => {
    let id = null;
    try {
      const { nombre, descripcion, precio, imagen } = nuevoProducto;

      if (!nombre || !descripcion || !precio || !imagen) {
        setError('Todos los campos son obligatorios');
        return;
      }

      if (isNaN(parseFloat(precio))) {
        setError('El precio debe ser un número válido');
        return;
      }

      const nuevoProductoRef = await addDoc(collection(db, "ProductosMEX"), { nombre, descripcion, precio });
      id = nuevoProductoRef.id;
      const imagenRef = ref(storage, `${id}.jpg`); 
      await uploadBytes(imagenRef, imagen);
      const imageUrl = await getDownloadURL(imagenRef);
      console.log("Imagen subida a Firebase Storage");

      const nuevoProductoData = {
        nombre,
        descripcion,
        precio,
        imagenUrl: imageUrl,
        imagen: `${id}.jpg`
      };

      await updateDoc(doc(db, "ProductosMEX", id), nuevoProductoData);
      console.log("Nuevo producto agregado a la base de datos");

      setReloadPage(prevState => !prevState);

      setNuevoProducto({ nombre: '', descripcion: '', precio: '', imagen: null });

      document.getElementById('file-input').value = null;
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const eliminarProducto = async (id) => {
    try {
      await deleteDoc(doc(db, "ProductosMEX", id));
      console.log("Document successfully deleted!");

      await deleteObject(ref(storage, `${id}.jpg`));
      
      setReloadPage(prevState => !prevState);
    } catch (error) {
      console.error("Error removing document: ", error);
    }
  };

  const actualizarProducto = async () => {
    try {
      await updateDoc(doc(db, "ProductosMEX", productoActualizado.id), productoActualizado);
      console.log("Document successfully updated!");
      setReloadPage(prevState => !prevState);
      ocultarFormulario();
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
    <div>
      <h1>Lista de Productos</h1>
      <input
        type="text"
        placeholder="Buscar productos"
        value={busqueda} onChange={handleInputChange} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {filtrarProductos(productos, busqueda).map(producto => (
          <li key={producto.id} className="producto">
            {producto.imagenUrl && <img src={producto.imagenUrl} alt={producto.nombre} />} {}
            <div>
              <h2>{producto.nombre}</h2>
              <p>{producto.descripcion}</p>
              <p>Precio: {producto.precio}</p>
              <button onClick={() => eliminarProducto(producto.id)}>Eliminar</button>
              <button onClick={() => mostrarFormulario(producto)}>Actualizar</button>
            </div>
          </li>
        ))}
      </ul>
      <h2>Agregar nuevo producto</h2>
      <input type="text" name="nombre" placeholder="Nombre" value={nuevoProducto.nombre} onChange={handleNuevoProductoChange} />
      <input type="text" name="descripcion" placeholder="Descripción" value={nuevoProducto.descripcion} onChange={handleNuevoProductoChange} />
      <input type="text" name="precio" placeholder="Precio" value={nuevoProducto.precio} onChange={handleNuevoProductoChange} />
      {}
      <input id="file-input" type="file" accept="image/*" onChange={handleImagenChange} />
      <button onClick={agregarProducto}>Agregar</button>

      {mostrarFormularioActualizar && (
        <div>
          <h2>Actualizar producto</h2>
          <input type="text" name="nombre" placeholder="Nombre" value={productoActualizado.nombre} onChange={handleProductoActualizadoChange} />
          <input type="text" name="descripcion" placeholder="Descripción" value={productoActualizado.descripcion} onChange={handleProductoActualizadoChange} />
          <input type="text" name="precio" placeholder="Precio" value={productoActualizado.precio} onChange={handleProductoActualizadoChange} />
          <button onClick={actualizarProducto}>Actualizar</button>
          <button onClick={ocultarFormulario}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

export default App;
