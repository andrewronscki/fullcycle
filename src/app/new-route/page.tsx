"use client";

import type {
  DirectionsResponseData,
  FindPlaceFromTextResponseData,
} from "@googlemaps/google-maps-services-js";
import { FormEvent, useRef, useState } from "react";
import { useMap } from "../hooks/useMap";

export default function NewRoutePage() {
  const [directions, setDirections] = useState<
    DirectionsResponseData & { request: any }
  >();
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const map = useMap(mapContainerRef);

  async function createRoute() {
    const startAddress = directions!.routes[0].legs[0].start_address;
    const endAddress = directions!.routes[0].legs[0].end_address;

    const response = await fetch("http://localhost:3333/routes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${startAddress}-${endAddress}`,
        source_id: directions!.request.origin.place_id,
        destination_id: directions!.request.destination.place_id,
      }),
    });
    await response.json();
  }

  async function searchPlaces(event: FormEvent) {
    event.preventDefault();

    const source = (document.getElementById("source") as HTMLInputElement)
      .value;
    const destination = (
      document.getElementById("destination") as HTMLInputElement
    ).value;

    const [sourceResponse, destinationResponse] = await Promise.all([
      fetch(`http://localhost:3333/places?text=${source}`),
      fetch(`http://localhost:3333/places?text=${destination}`),
    ]);

    const [sourcePlace, destinationPlace]: FindPlaceFromTextResponseData[] =
      await Promise.all([sourceResponse.json(), destinationResponse.json()]);

    if (sourcePlace.status !== "OK") {
      console.error(sourcePlace);
      alert("Não foi possível encontrar a origem");
      return;
    }

    if (destinationPlace.status !== "OK") {
      console.error(sourcePlace);
      alert("Não foi possível encontrar o destino");
      return;
    }

    const placeSourceId = sourcePlace.candidates[0].place_id;
    const placeDestinationId = destinationPlace.candidates[0].place_id;

    const directionsResponse = await fetch(
      `http://localhost:3333/directions?originId=${placeSourceId}&destinationId=${placeDestinationId}`
    );
    const directionsData: DirectionsResponseData & { request: any } =
      await directionsResponse.json();

    setDirections(directionsData);

    map?.removeAllRoutes();
    await map?.addRouteWithIcons({
      routeId: "1",
      startMarkerOptions: {
        position: directionsData.routes[0].legs[0].start_location,
      },
      endMarkerOptions: {
        position: directionsData.routes[0].legs[0].end_location,
      },
      carMarkerOptions: {
        position: directionsData.routes[0].legs[0].start_location,
      },
    });
  }

  return (
    <div className="flex flex-row">
      <div className="flex min-h-screen flex-col bg-slate-950 p-4 gap-4 w-64">
        <h1 className="text-white text-2xl">Nova rota</h1>

        <form onSubmit={searchPlaces} className="flex flex-col gap-2">
          <div>
            <input id="source" type="text" placeholder="Origem" />
          </div>

          <div>
            <input id="destination" type="text" placeholder="Destino" />
          </div>

          <button type="submit" className="bg-yellow-400">
            Pesquisar
          </button>
        </form>

        {directions && (
          <div className="flex flex-col gap-2 bg-slate-700 p-2">
            <span className="text-white text-sm">
              Origem: {directions.routes[0].legs[0].start_address}
            </span>
            <span className="text-white text-sm">
              Destino: {directions.routes[0].legs[0].end_address}
            </span>

            <button onClick={createRoute} className="bg-yellow-400">
              Criar rota
            </button>
          </div>
        )}
      </div>
      <div
        className="flex min-h-screen w-full"
        id="map"
        ref={mapContainerRef}
      />
    </div>
  );
}
