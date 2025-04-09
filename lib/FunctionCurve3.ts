import { Curve, Vector2, Vector3 } from 'three';

/**
 * An arbitrary 3D curve defined by a getPoint function.
 *
 * ```js
 * const curve = new THREE.FunctionCurve3( (t, optionalTarget) => {
 *  const x = t * 10;
 *  const y = Math.sin( t * Math.PI * 2 ) * 5;
 * const z = t * 10;
 * return optionalTarget.set( x, y, z ); // is it really optional?
 * } );
 *
 * const points = curve.getPoints( 50 );
 * const geometry = new THREE.BufferGeometry().setFromPoints( points );
 *
 * const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
 *
 * // Create the final object to add to the scene
 * const object = new THREE.Line( geometry, material );
 * ```
 *
 * @augments Curve
 */
class FunctionCurve3 extends Curve<Vector3> {
	/**
	 * This flag can be used for type testing.
	 *
	 * @type {boolean}
	 * @readonly
	 * @default true
	 */
	isFunctionCurve3 = true;

	type: "FunctionCurve3" = "FunctionCurve3";
	
	/**
	 * The curve function.
	 *
	 * @type {(t: number, optionalTarget?: Vector3) => Vector3}
	 * @default 
	 */
	fn: (t: number, optionalTarget?: Vector3) => Vector3;

	/**
	 * Constructs a 3D curve from a function.
	 */
	constructor(fn: (t: number, optionalTarget?: Vector3) => Vector3) {

		super();

		this.fn = fn;

	}

	/**
	 * Returns a point on the curve.
	 *
	 * @param {number} t - A interpolation factor representing a position on the curve. Must be in the range `[0,1]`.
	 * @param {Vector2} [optionalTarget] - The optional target vector the result is written to.
	 * @return {Vector2} The position on the curve.
	 */
	getPoint(t: number, optionalTarget = new Vector3()) {

		return this.fn(t, optionalTarget);

	}

	copy(source: FunctionCurve3): this {

		super.copy(source);

		this.fn = source.fn;

		return this;

	}

}

export { FunctionCurve3 };

